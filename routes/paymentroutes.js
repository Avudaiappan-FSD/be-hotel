const express = require('express');
const paymentrouter = express.Router();
const auth = require('../middleware/auth');
const paymentController = require('../controllers/paymentcontroller');
const { recompileSchema } = require('../models/Payment');


paymentrouter.post('/create-order', auth.checkAuth,auth.allowroles(['customer']), paymentController.createOrder);
paymentrouter.post('/verify-payment', auth.checkAuth, auth.allowroles(['customer']), paymentController.verifyPayment);
paymentrouter.get('/my-payments', auth.checkAuth, auth.allowroles(['customer']), paymentController.getMyPayments);
paymentrouter.get('/:id', auth.checkAuth, auth.allowroles(['customer', 'admin','receptionist']), paymentController.getPaymentById);
paymentrouter.get('/', auth.checkAuth, auth.allowroles(['receptionist', 'admin']), paymentController.getAllPayments);
paymentrouter.put('/:id/status', auth.checkAuth, auth.allowroles(['admin','receptionist']), paymentController.updatePaymentStatus);

module.exports = paymentrouter;