const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentstatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    razorpayorderid: {
        type: String,
        default: null
    },
    razorpaymentid: {
        type: String,
        default: null
    },
    razorpaysignature: {
        type: String,
        default: null
    },
    paymentmethod: {
        type: String,
        enum: ['razorpay', 'cash'],
        default: 'razorpay'
    },
    paidat: {
        type: Date,
        default: null
    }
},
    {
        timestamps: true
    });
module.exports = mongoose.model('Payment', paymentSchema);