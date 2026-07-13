const express = require('express');
const authcontroller = require('../controllers/authcontroller');
const authrouter = express.Router();
const auth = require('../middlewares/auth');
authrouter.post('/register', authcontroller.register);
authrouter.post('/login', authcontroller.login);
authrouter.get('/logout', authcontroller.logout);
authrouter.get('/me', auth.checkAuth, authcontroller.me);

module.exports = authrouter;
