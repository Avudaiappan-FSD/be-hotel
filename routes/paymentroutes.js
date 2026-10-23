const express = require('express');
const paymentrouter = express.Router();
const auth = require('../middlewares/auth');
const paymentController = require('../controllers/paymentcontroller');



paymentrouter.post('/createorder', auth.checkAuth,auth.allowroles(['customer']), paymentController.createOrder);
paymentrouter.post('/verifypayment', auth.checkAuth, auth.allowroles(['customer']), paymentController.verifyPayment);
paymentrouter.get('/mypayments', auth.checkAuth, auth.allowroles(['customer']), paymentController.getMyPayments);
paymentrouter.get('/:id', auth.checkAuth, auth.allowroles(['customer', 'admin','receptionist']), paymentController.getPaymentById);
paymentrouter.get('/allpayments', auth.checkAuth, auth.allowroles(['receptionist', 'admin']), paymentController.getAllPayments);
paymentrouter.put('/:id/status', auth.checkAuth, auth.allowroles(['admin','receptionist']), paymentController.updatePaymentStatus);

module.exports = paymentrouter;