import express from 'express';
import authCheck from "./../middlewares/auth.check.js";
import MockController from './../controllers/mock.controller.js'


const MockRoutes = express.Router();

MockRoutes.get('/slugs/get', authCheck, MockController.getSlugs);
MockRoutes.get('/chapters/get', authCheck, MockController.getChapters);
MockRoutes.post('/generate', authCheck, MockController.generate);
MockRoutes.get('/get', authCheck, MockController.get);
MockRoutes.post('/submit', authCheck, MockController.submit);

export default MockRoutes;
