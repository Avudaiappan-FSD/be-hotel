const express = require('express');
const authcontroller = require('../controllers/authcontroller');
const authrouter = express.Router();
authrouter.post('/register', authcontroller.register);
authrouter.post('/login', authcontroller.login);
authrouter.post('/logout', authcontroller.logout);
authrouter.get('/me', authcontroller.me);

module.exports = authrouter;
