const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    roomnumber: {
        type: Number,
        required: true
    },
    checkin: {
        type: Date,
        required: true
    },
    checkout: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('Booking', bookingSchema, 'Bookings');