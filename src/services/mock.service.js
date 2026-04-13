import DB from '../db/db.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class MockService {
    constructor() {
        this.taskRepo = DB.getRepository('Task');
        this.mockRepo = DB.getRepository('Mock');
        this.testRepo = DB.getRepository('Test');
        this.slugRepo = DB.getRepository('Slug');
        this.chapterRepo = DB.getRepository('Chapter');
    }

    // Вспомогательный метод для вставки переменных в шаблон
    compilePattern(pattern, context) {
        if (!pattern) return undefined;
        return pattern.replace(/<<([^>]+)>>/g, (match, key) => {
            return context[key] !== undefined ? context[key] : match;
        });
    }

    async generate(clientId, mockConfig, testConfig) {
        const totalReqTasks = Object.values(testConfig).reduce((sum, val) => sum + val, 0);
        if (totalReqTasks !== mockConfig.amount) {
            throw new AppError('MOCKS_GEN_INVREQ', 400);
        }

        let tasksPull = [];

        // Проходимся по всем запрошенным ГЛАВАМ
        for (const [chapter, amount] of Object.entries(testConfig)) {
            // 1. Находим все слаги для данной главы
            const slugs = await this.slugRepo.find({ select: ['slug'], where: { chapter } });
            if (!slugs.length) throw new AppError('MOCKS_GEN_INVTC', 400);

            // 2. Случайно распределяем нужное количество задач (amount) между этими слагами
            const slugAllocation = {};
            slugs.forEach(s => slugAllocation[s.slug] = 0);

            let tasksToAllocate = amount;
            while (tasksToAllocate > 0) {
                const randomSlug = slugs[Math.floor(Math.random() * slugs.length)].slug;
                slugAllocation[randomSlug]++;
                tasksToAllocate--;
            }

            // 3. Вытаскиваем случайные задачи из БД согласно нашему распределению
            for (const [slug, count] of Object.entries(slugAllocation)) {
                if (count === 0) continue; // Пропускаем слаги, которым не выпала квота

                const tasks = await this.taskRepo.createQueryBuilder('task')
                    .where('task.slug = :slug', { slug })
                    .orderBy('RANDOM()')
                    .limit(count)
                    .getMany();

                tasksPull.push(...tasks);
            }
        }

        // Если из-за нехватки задач в конкретных слагах мы не добрали общую сумму
        if (tasksPull.length !== mockConfig.amount) {
            throw new AppError('MOCKS_GEN_INVTC', 400);
        }

        const mock = await this.mockRepo.save(this.mockRepo.create({
            client_id: clientId,
            config: mockConfig
        }));

        const testsPull = tasksPull.map((task, index) => ({
            mock_id: mock.id,
            task_id: task.id,
            index: index + 1
        }));
        await this.testRepo.save(testsPull);

        return mock.id;
    }

    async getChapters() {
        // Подтягиваем главы вместе с массивом их слагов
        const chapters = await this.chapterRepo.find({
            relations: ['slugs']
        });

        // Дожидаемся подсчета всех задач
        const responseData = await Promise.all(chapters.map(async (ch) => {
            let total_tasks = 0;
            const slugs = [];

            await Promise.all(ch.slugs.map(async (s) => {
                const amount = await this.taskRepo.count({where: {slug: s.slug}});
                total_tasks += amount;
                slugs.push(s.slug);
            }));

            return {
                chapter: ch.chapter,
                title: ch.title,
                slugs: slugs,
                total_tasks: total_tasks
            };
        }));

        return responseData;
    }

    async getMockDetails(mockId, userId) {
        const mock = await this.mockRepo.findOne({
            where: { id: mockId },
            relations: ['tests', 'tests.task', 'tests.task.slug_rel'],
            order: { tests: { index: 'ASC' } }
        });

        if (!mock) throw new AppError('MOCKS_GET_WRNGMOCK', 404);
        if (mock.client_id && userId !== mock.client_id) {
            throw new AppError('MOCKS_GEN_AUTHREQ', 401);
        }

        const testObject = {};
        mock.tests.forEach(test => {
            const task = test.task;
            const pattern = task.slug_rel?.pattern;

            if (!task.answer || !task.distractors || !pattern) {
                logger.error(`DB Corrupted task found: ${task.id}`);
                return;
            }

            const options = [task.answer, ...task.distractors]
                .sort(() => Math.random() - 0.5);

            testObject[test.index] = {
                task: {
                    texts: {
                        en: this.compilePattern(pattern.en, task.context),
                        ch: this.compilePattern(pattern.ch, task.context)
                    },
                    options
                },
                response: test.response || null,
                is_correct: test.is_correct || null
            };
        });

        const { tests, ...cleanMockData } = mock;
        return { mock: cleanMockData, test: testObject };
    }

    async submitResponse(mockId, taskId, response, userId) {
        const mock = await this.mockRepo.findOneBy({ id: mockId });
        if (!mock) throw new AppError('MOCKS_SUBMIT_WRNGMOCK', 404);
        if (mock.status === 'completed') throw new AppError('MOCKS_SUBMIT_COMPLETED', 403);

        // Ищем запись теста по связке mock_id + task_id
        const testRecord = await this.testRepo.findOne({
            where: { mock_id: mockId, task_id: taskId },
            relations: ['task']
        });

        if (!testRecord) throw new AppError('MOCKS_SUBMIT_WRNGIDX', 400);

        const isCorrect = String(response).trim() === String(testRecord.task.answer).trim();
        testRecord.response = response;
        testRecord.is_correct = isCorrect;
        await this.testRepo.save(testRecord);

        mock.points = await this.testRepo.count({ where: { mock_id: mockId, is_correct: true } });
        await this.mockRepo.save(mock);

        // Возвращаем результат только если instant_check = true
        return {
            is_correct: mock.config.instant_check ? isCorrect : undefined
        };
    }

    async finishMock(mockId, timeSpent, userId) {
        const mock = await this.mockRepo.findOneBy({ id: mockId });
        if (!mock || mock.status === 'completed') throw new AppError('MOCKS_FINISH_INVREQ', 400);

        mock.status = 'completed';
        mock.timer = timeSpent; // Доверяем времени, которое прислал клиент
        await this.mockRepo.save(mock);

        return { points: mock.points, timer: mock.timer };
    }

    async getHistory(userId) {
        if (!userId) throw new AppError('MOCKS_HIST_AUTHREQ', 401);

        // Достаем все моки пользователя, сортируем от новых к старым
        const mocks = await this.mockRepo.find({
            where: { client_id: userId },
            order: { created_at: 'DESC' }
        });

        return mocks;
    }
}

export default new MockService();