const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomnumber: {
        type: Number,
        required: true,
    },
    roomtype: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    capacity: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    isavailable: {
        type: Boolean,
        default: true,
    }
});

module.exports = mongoose.model('Room', roomSchema, 'Rooms');