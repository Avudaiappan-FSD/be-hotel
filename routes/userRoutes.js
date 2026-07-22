const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const user = require('../models/User');



userRouter.get('/profile',auth.checkAuth, auth.allowroles(['customer', 'receptionist', 'admin']), userController.getprofile);
userRouter.put('/profile', auth.checkAuth, auth.allowroles(['customer', 'receptionist', 'admin']), userController.updateprofile);
userRouter.delete('/profile', auth.checkAuth, auth.allowroles(['customer', 'receptionist', 'admin']), userController.deleteprofile);

module.exports = userRouter;