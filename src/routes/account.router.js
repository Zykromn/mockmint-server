import express from 'express';

import authCheck from "./../middlewares/auth.check.js";
import AccountController from './../controllers/account.controller.js';


const AccountRoutes = express.Router();

AccountRoutes.get('/get', authCheck, AccountController.get);

export default AccountRoutes;