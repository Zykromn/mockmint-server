import MockService from '../services/mock.service.js';

class MockController {
    async generate(req, res, next) {
        try {
            const mockId = await MockService.generate(req.user.id, req.body.mock_config, req.body.test_config);
            res.status(201).json({ code: 'MOCKS_GEN_SUCCESS', mock_id: mockId });
        } catch (e) { next(e); }
    }

    async get(req, res, next) {
        try {
            const data = await MockService.getMockDetails(req.query.mock_id, req.user?.id);
            res.status(200).json({ code: 'MOCKS_GET_SUCCESS', ...data });
        } catch (e) { next(e); }
    }

    async submit(req, res, next) {
        try {
            // Передаем task_id вместо index
            const result = await MockService.submitResponse(
                req.body.mock_id,
                req.body.task_id,
                req.body.response,
                req.user.id
            );
            res.status(200).json({ code: 'MOCKS_SUBM_SUCCESS', ...result });
        } catch (e) { next(e); }
    }

    async finish(req, res, next) {
        try {
            // Передаем time_spent из req.body
            const result = await MockService.finishMock(
                req.body.mock_id,
                req.body.time_spent,
                req.user.id
            );
            res.status(200).json({ code: 'MOCKS_FINISH_SUCCESS', ...result });
        } catch (e) { next(e); }
    }
}

export default new MockController();