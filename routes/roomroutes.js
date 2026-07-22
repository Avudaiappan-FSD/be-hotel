const express = require('express');
const roomRouter = express.Router();
const roomController = require('../controllers/roomcontroller');    
const auth = require('../middlewares/auth');


roomRouter.post('/rooms', auth.checkAuth, auth.allowroles(['admin']), roomController.createroom);
roomRouter.get('/rooms', auth.checkAuth, roomController.getllrooms);
roomRouter.get('/rooms/:id', auth.checkAuth, roomController.getroombyid);
roomRouter.put('/rooms/:id', auth.checkAuth, roomController.updateroom);
roomRouter.delete('/rooms/:id', auth.checkAuth, roomController.deleteroom);
roomRouter.get('/rooms/available', auth.checkAuth, roomController.available);
roomRouter.get('/search', auth.checkAuth, roomController.searchrooms);
module.exports = roomRouter;