const payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentcontroller = {
    createOrder: async (req, res) => {
        try {
            const { bookingId } = req.body;

            if (!bookingId) {
                return res.status(400).json({
                    message: "Booking ID is required",
                });
            }
            const booking = await Booking.findById(bookingId);

            if (!booking) {
                return res.status(404).json({
                    message: "Booking not found",
                });
            }
            if (booking.user.toString() !== req.userId.toString()) {
                return res.status(403).json({
                    message: "You are not allowed to pay for this booking",
                });
            }
            if (booking.paymentstatus === "paid") {
                return res.status(400).json({
                    message: "This booking has already been paid",
                });
            }
            const amountInPaise = Math.round(Number(booking.totalprice) * 100);

            if (!amountInPaise || amountInPaise <= 0) {
                return res.status(400).json({
                    message: "Invalid booking amount",
                });
            }
            const existingPayment = await payment.findOne({
                booking: booking._id,
                paymentstatus: "completed",
            });
            if (existingPayment) {
                return res.status(400).json({
                    message: "Payment already completed for this booking",
                });
            }
            const order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: `booking_${booking._id}`,
                notes: {
                    bookingId: booking._id.toString(),
                    userId: req.userId.toString(),
                },
            });
            let payment = await payment.findOne({
                booking: booking._id,
                user: req.userId,
                paymentstatus: "pending",
            });
            if (payment) {
                payment.amount = booking.totalprice;
                payment.razorpayorderid = order.id;
                payment.paymentmethod = "razorpay";
                await payment.save();
            } else {
                payment = await payment.create({
                    booking: booking._id,
                    user: req.userId,
                    amount: booking.totalprice,
                    paymentstatus: "pending",
                    razorpayorderid: order.id,
                    paymentmethod: "razorpay",
                });
            }
            return res.status(201).json({
                message: "Payment order created successfully",
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                paymentId: payment._id,
                keyId: process.env.RAZORPAY_KEY_ID,
            });

        } catch (error) {
            console.error('Error creating payment order:', error);
            res.status(500).json({ error: 'Failed to create payment order' });
        }
    },
    verifyPayment: async (req, res) => {
        try {
            const { paymentId, orderId, signature } = req.body;

            const payment = await payment.findById(paymentId);
            if (!payment) {
                return res.status(404).json({
                    message: "Payment not found",
                });
            }

            const order = await razorpay.orders.fetch(orderId);
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${orderId}|${payment.razorpayorderid}`)
                .digest('hex');

            if (expectedSignature !== signature) {
                return res.status(400).json({
                    message: "Invalid payment signature",
                });
            }

            payment.paymentstatus = "completed";
            await payment.save();

            return res.status(200).json({
                message: "Payment verified successfully",
            });
        } catch (error) {
            console.error('Error verifying payment:', error);
            res.status(500).json({ error: 'Failed to verify payment' });
        }
    },
    getMyPayments: async (req, res) => {
        try {

        } catch (error) {
            console.error('Error fetching user payments:', error);
            res.status(500).json({ error: 'Failed to fetch user payments' });
        }
    },
    getPaymentById: async (req, res) => {
        try {
        } catch (error) {
            console.error('Error fetching payment:', error);
            res.status(500).json({ error: 'Failed to fetch payment' });
        }
    },
    getAllPayments: async (req, res) => {
        try {
        } catch (error) {
            console.error('Error fetching payments:', error);
            res.status(500).json({ error: 'Failed to fetch payments' });
        }
    },
    updatePaymentStatus: async (req, res) => {
        try {
        } catch (error) {
            console.error('Error updating payment status:', error);
            res.status(500).json({ error: 'Failed to update payment status' });
        }
    },

}