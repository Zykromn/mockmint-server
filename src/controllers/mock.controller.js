import logger from './../utils/logger.js';
import DB from './../db/db.js';
import Joi from 'joi';

class MockController {
    static moderateGenMock = Joi.object({
        mock_config: Joi.object({
            amount:        Joi.number().integer().positive().required(),
            timed:         Joi.boolean().required(),
            instant_check: Joi.boolean().required(),
            lang:          Joi.string().valid('en', 'ch').required()
        }).required(),

        test_config: Joi.object().pattern(
            Joi.string(),
            Joi.number().integer().positive()
        ).min(1).required()
    });

    static compilePattern = (pattern, context) => {
        if (!pattern) return undefined;
        return pattern.replace(/<<([^>]+)>>/g, (match, key) => {
            return context[key] !== undefined ? context[key] : match;
        });
    };

    static submitSchema = Joi.object({
        mock_id:  Joi.string().uuid().required(),
        index:    Joi.number().integer().positive().required(),
        response: Joi.string().allow('').required()
    });

    static finishSchema = Joi.object({
        mock_id: Joi.string().uuid().required()
    });

    // ==========================================
    // ГЕНЕРАЦИЯ ЭКЗАМЕНА
    // ==========================================
    static async generate(req, res, next) {
        try {
            const { error, value } = MockController.moderateGenMock.validate(req.body);
            if (error) {
                return res.status(400).json({ code: `MOCKS_GEN_INVREQ` });
            }
            const { mock_config, test_config } = value;

            const totalReqTasks = Object.values(test_config).reduce((sum, val) => sum + val, 0);
            if (totalReqTasks !== mock_config.amount) {
                return res.status(400).json({ code: `MOCKS_GEN_INVREQ` });
            }

            const taskRepo = DB.getRepository('Task');
            const mockRepo = DB.getRepository('Mock');
            const testsRepo = DB.getRepository('Test');

            let tasksPull = [];
            for (const [slug, amount] of Object.entries(test_config)) {
                // Ищем задачи по внешнему ключу slug
                const tasks = await taskRepo.createQueryBuilder('task')
                    .where('task.slug = :slug', { slug })
                    .orderBy('RANDOM()')
                    .limit(amount)
                    .getMany();

                if (tasks.length < amount) {
                    return res.status(400).json({ code: 'MOCKS_GEN_INVTC', slug });
                }

                tasksPull.push(...tasks);
            }

            const mock = await mockRepo.save(mockRepo.create({
                client_id: req.user.id,
                config: mock_config
            }));

            const testsPull = tasksPull.map((task, index) => ({
                mock_id: mock.id,
                task_id: task.id,
                index: index + 1
            }));
            await testsRepo.save(testsPull);

            return res.status(201).json({ code: 'MOCKS_GEN_SUCCESS', mock_id: mock.id });
        } catch (error) {
            return next(error);
        }
    }

    // ==========================================
    // ПОЛУЧЕНИЕ ЭКЗАМЕНА / СПИСКА ЭКЗАМЕНОВ
    // ==========================================
    static async get(req, res, next) {
        try {
            const { mock_id } = req.query;
            const mockRepo = DB.getRepository('Mock');

            if (mock_id) {
                const { error } = Joi.string().uuid().validate(mock_id);
                if (error) {
                    return res.status(400).json({ code: 'MOCKS_GET_WRNGMOCK' });
                }

                // relation для слага теперь называется slug_rel (согласно entities.js)
                const mock = await mockRepo.findOne({
                    where: { id: mock_id },
                    relations: ['tests', 'tests.task', 'tests.task.slug_rel'],
                    order: { tests: { index: 'ASC' } }
                });

                if (!mock) {
                    return res.status(400).json({ code: 'MOCKS_GET_WRNGMOCK' });
                }

                if (mock.client_id && (!req.user || req.user.id !== mock.client_id)) {
                    return res.status(401).json({ code: 'MOCKS_GEN_AUTHREQ' });
                }

                const testObject = {};
                let index = 1;
                let corruptedTasks = 0;

                mock.tests.forEach(test => {
                    const task = test.task;
                    const pattern = task.slug_rel ? task.slug_rel.pattern : null;

                    if (!task.answer || !task.distractors || !task.distractors.length || !pattern || !pattern.en || !pattern.ch) {
                        logger.error(`DB corrupted task (${task.id} | ${task.slug}):`);
                        corruptedTasks++;
                        return;
                    }

                    const compiledTexts = {
                        en: MockController.compilePattern(pattern.en, task.context),
                        ch: MockController.compilePattern(pattern.ch, task.context)
                    };

                    // ИСПРАВЛЕНО: берем task.response вместо task.answer
                    const options = [task.answer, ...task.distractors];
                    for (let i = options.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [options[i], options[j]] = [options[j], options[i]];
                    }

                    testObject[index] = {
                        task: {
                            texts: compiledTexts,
                            options: options
                        },
                        response: test.response || null,
                        is_correct: test.is_correct || null
                    };
                    index++;
                });

                const { tests, ...cleanMockData } = mock;

                const payload = {
                    code: 'MOCKS_GET_SUCCESS',
                    mock: cleanMockData,
                    test: testObject
                };

                if (corruptedTasks > 0) {
                    payload.warn = `MOCKS_GET_CORRUPTED_TASKS`;
                    payload.corruptedTasks = corruptedTasks;
                }
                if (Object.keys(testObject).length === 0) {
                    return res.status(500).json({ code: 'SERVER_ITERNAL_ERR' });
                }

                return res.status(200).json(payload);
            }

            const userMocks = await mockRepo.find({
                where: { client_id: req.user.id },
                order: { created_at: 'DESC' }
            });

            return res.status(200).json({
                code: 'MOCKS_GET_SUCCESS',
                mocks: userMocks
            });

        } catch (error) {
            return next(error);
        }
    }

    // ==========================================
    // СПРАВОЧНИК СЛАГОВ
    // ==========================================
    static async getSlugs(req, res, next) {

        try {
            const { slug } = req.query;
            const slugRepo = DB.getRepository('Slug');
            const taskRepo = DB.getRepository('Task');

            if (slug) {
                const targetSlug = await slugRepo.findOne({ where: { slug } });
                if (!targetSlug) {
                    return res.status(400).json({ code: 'MOCKS_SLUGS_WRNGSLUG' });
                }

                const amount = await taskRepo.count({ where: { slug } });

                return res.status(200).json({
                    code: 'MOCKS_SLUGS_GETSUCC',
                    slug: {
                        slug: targetSlug.slug,
                        chapter: targetSlug.chapter,
                        amount: amount
                    }
                });
            }

            const allSlugs = await slugRepo.find({
                select: ['slug', 'chapter']
            });

            return res.status(200).json({
                code: 'MOCKS_SLUGS_GETSUCC',
                slugs: allSlugs
            });

        } catch (error) {
            return next(error);
        }
    }

    // ==========================================
    // СПРАВОЧНИК ГЛАВ
    // ==========================================
    static async getChapters(req, res, next) {
        try {
            const chapterRepo = DB.getRepository('Chapter');
            const taskRepo = DB.getRepository('Task');

            const chapters = await chapterRepo.find({
                relations: ['slugs']
            });

            const responseData = await Promise.all(chapters.map(async (ch) => {
                let total_tasks = 0;
                const slugs = [];

                await Promise.all(ch.slugs.map(async (s) => {
                    const amount = await taskRepo.count({ where: { slug: s.slug } });
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

            return res.status(200).json({
                code: 'MOCKS_CHAPS_GETSUCC',
                chapters: responseData
            });

        } catch (error) {
            return next(error);
        }
    }

    // ==========================================
    // ОТПРАВКА ОТВЕТА (SUBMIT)
    // ==========================================
    static async submit(req, res, next) {
        try {
            const { error, value } = MockController.submitSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ code: 'MOCKS_SUBMIT_INVREQ' });
            }

            const { mock_id, index, response } = value;

            const mockRepo = DB.getRepository('Mock');
            const testRepo = DB.getRepository('Test');

            // 1. Ищем мок
            const mock = await mockRepo.findOneBy({ id: mock_id });
            if (!mock) {
                return res.status(400).json({ code: 'MOCKS_SUBMIT_WRNGMOCK' });
            }

            // 2. Проверяем права доступа
            if (mock.client_id && (!req.user || req.user.id !== mock.client_id)) {
                return res.status(401).json({ code: 'MOCKS_SUBMIT_AUTHREQ' });
            }

            // 3. Защита от записи после завершения
            if (mock.status === 'completed') {
                return res.status(403).json({ code: 'MOCKS_SUBMIT_COMPLETED' });
            }

            // 4. Ищем конкретную задачу в тесте (вместе с эталонным task, чтобы узнать ответ)
            const testRecord = await testRepo.findOne({
                where: { mock_id, index },
                relations: ['task']
            });

            if (!testRecord) {
                return res.status(400).json({ code: 'MOCKS_SUBMIT_WRNGIDX' });
            }

            // 5. Проверяем ответ (приводим к строке и обрезаем пробелы по краям для надежности)
            // Здесь сравниваем ответ юзера (response) с эталоном из базы (task.answer)
            const isCorrect = (String(response).trim() === String(testRecord.task.answer).trim());

            // 6. Сохраняем результат в таблицу Tests
            testRecord.response = response;
            testRecord.is_correct = isCorrect;
            await testRepo.save(testRecord);

            // 7. Надежный пересчет баллов: считаем все is_correct = true для этого мока
            const correctCount = await testRepo.count({
                where: { mock_id, is_correct: true }
            });
            mock.points = correctCount;
            await mockRepo.save(mock);

            // 8. Формируем ответ клиенту в зависимости от instant_check
            const payload = { code: 'MOCKS_SUBMIT_SUCCESS' };

            if (mock.config && mock.config.instant_check === true) {
                // Если проверка мгновенная, отдаем результат
                payload.is_correct = isCorrect;
                // Опционально: можно возвращать correct_answer, если юзер ошибся, чтобы показать правильный вариант
            }

            return res.status(200).json(payload);

        } catch (error) {
            return next(error);
        }
    }

    static async finish(req, res, next) {
        try {
            const { error, value } = MockController.finishSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ code: 'MOCKS_FINISH_INVREQ' });
            }

            const { mock_id } = value;
            const mockRepo = DB.getRepository('Mock');

            const mock = await mockRepo.findOneBy({ id: mock_id });
            if (!mock) {
                return res.status(404).json({ code: 'MOCKS_FINISH_WRNGMOCK' });
            }

            if (mock.client_id && (!req.user || req.user.id !== mock.client_id)) {
                return res.status(401).json({ code: 'MOCKS_FINISH_AUTHREQ' });
            }

            if (mock.status === 'completed') {
                return res.status(400).json({ code: 'MOCKS_FINISH_ALREADY_COMPLETED' });
            }

            // Вычисляем затраченное время в миллисекундах
            const startTime = new Date(mock.created_at).getTime();
            const timeSpentMs = Date.now() - startTime;

            // Обновляем статус и таймер
            mock.status = 'completed';
            mock.timer = timeSpentMs;
            await mockRepo.save(mock);

            return res.status(200).json({
                code: 'MOCKS_FINISH_SUCCESS',
                points: mock.points,
                timer: mock.timer
            });

        } catch (error) {
            return next(error);
        }
    }
}

export default MockController;