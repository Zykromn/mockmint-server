import express from 'express';
import MockController from '../controllers/mock.controller.js';
import authCheck from '../middlewares/auth.check.js';
import { validate } from '../middlewares/validate.middleware.js';
import { MockValidator } from '../validators/mock.validator.js';

const MockRoutes = express.Router();

MockRoutes.post('/generate', authCheck, validate(MockValidator.generate), MockController.generate);
MockRoutes.get('/get', validate(MockValidator.getMock, 'query'), MockController.get);
MockRoutes.post('/submit', authCheck, validate(MockValidator.submit), MockController.submit);
MockRoutes.post('/finish', authCheck, validate(MockValidator.finish), MockController.finish);

export default MockRoutes;