const express = require('express');
const bookingrouter = express.Router();
const auth = require('../middlewares/auth');
const bookingcontroller = require('../controllers/bookingcontroller');

bookingrouter.post('/bookings', auth.checkAuth, auth.allowroles(['customer', 'receptionist']), bookingcontroller.createBooking);
bookingrouter.get('/bookings/user/:userId', auth.checkAuth, auth.allowroles(['customer']), bookingcontroller.getmybookings);
bookingrouter.get('/bookings', auth.checkAuth, auth.allowroles(['receptionist', 'admin']), bookingcontroller.getAllBookings);
bookingrouter.get('/bookings/:id', auth.checkAuth, auth.allowroles(['receptionist', 'admin']), bookingcontroller.getBookingById);
bookingrouter.put('/bookings/:id', auth.checkAuth, auth.allowroles(['customer', 'receptionist', 'admin']), bookingcontroller.updateBooking);
bookingrouter.delete('/bookings/:id', auth.checkAuth, auth.allowroles(['customer', 'receptionist']), bookingcontroller.deleteBooking);

module.exports = bookingrouter;
