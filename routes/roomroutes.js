const express = require('express');
const roomRouter = express.Router();
const roomController = require('../controllers/roomcontroller');    
const auth = require('../middlewares/auth');


roomRouter.post('/rooms', auth.checkAuth, auth.allowroles(['admin']), roomController.createroom);
roomRouter.get('/rooms', auth.checkAuth, auth.allowroles(['admin', 'user','receptionist']), roomController.getallrooms);
roomRouter.get('/rooms/available', auth.checkAuth, auth.allowroles(['admin', 'user']), roomController.available);
roomRouter.post('/search', auth.checkAuth, auth.allowroles(['admin', 'user']), roomController.searchrooms);
roomRouter.get('/rooms/:id', auth.checkAuth, auth.allowroles(['admin', 'user']), roomController.getroombyid);
roomRouter.put('/rooms/:id', auth.checkAuth, auth.allowroles(['admin']), roomController.updateroom);
roomRouter.delete('/rooms/:id', auth.checkAuth, auth.allowroles(['admin']), roomController.deleteroom);

module.exports = roomRouter;