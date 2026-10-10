const crypto = require("crypto");
const Razorpay = require("razorpay");

const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { razorpaykeyid, razorpaykeysecret } = require("../utils/config");

const razorpay = new Razorpay({
    key_id: razorpaykeyid,
    key_secret: razorpaykeysecret,
});


const paymentController = {
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
                    message: "This booking is already paid",
                });
            }

            const amount = Number(booking.totalprice);

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    message: "Invalid booking amount",
                });
            }

            const existingPayment = await Payment.findOne({
                booking: booking._id,
                paymentstatus: "completed",
            });

            if (existingPayment) {
                return res.status(400).json({
                    message: "Payment already completed",
                });
            }

            const order = await razorpay.orders.create({
                amount: Math.round(amount * 100),
                currency: "INR",
                receipt: `booking_${booking._id}`,
            });

            const payment = await Payment.create({
                booking: booking._id,
                user: req.userId,
                amount,
                paymentstatus: "pending",
                razorpayorderid: order.id,
                paymentmethod: "razorpay",
            });

            return res.status(201).json({
                message: "Order created successfully",
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                paymentId: payment._id,
                keyId: process.env.RAZORPAY_KEY_ID,
            });
        } catch (error) {
            console.error("Create order error:", error);

            return res.status(500).json({
                message: "Failed to create payment order",
            });
        }
    },

    verifyPayment: async (req, res) => {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
            } = req.body;

            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature
            ) {
                return res.status(400).json({
                    message: "Payment details are required",
                });
            }

            const payment = await Payment.findOne({
                razorpayorderid: razorpay_order_id,
            });

            if (!payment) {
                return res.status(404).json({
                    message: "Payment record not found",
                });
            }

            if (payment.user.toString() !== req.userId.toString()) {
                return res.status(403).json({
                    message: "You are not allowed to verify this payment",
                });
            }

            if (payment.paymentstatus === "completed") {
                return res.status(200).json({
                    message: "Payment already verified",
                    payment,
                });
            }

            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                payment.paymentstatus = "failed";
                await payment.save();

                await Booking.findByIdAndUpdate(payment.booking, {
                    paymentstatus: "failed",
                });

                return res.status(400).json({
                    message: "Invalid payment signature",
                });
            }

            payment.razorpaypaymentid = razorpay_payment_id;
            payment.razorpaysignature = razorpay_signature;
            payment.paymentstatus = "completed";
            payment.paidat = new Date();

            await payment.save();

            await Booking.findByIdAndUpdate(payment.booking, {
                paymentstatus: "paid",
            });

            return res.status(200).json({
                message: "Payment verified successfully",
                payment,
            });
        } catch (error) {
            console.error("Verify payment error:", error);

            return res.status(500).json({
                message: "Failed to verify payment",
            });
        }
    },

    getMyPayments: async (req, res) => {
        try {
            const payments = await Payment.find({
                user: req.userId,
            })
                .populate("booking")
                .sort({ createdAt: -1 });

            return res.status(200).json({
                count: payments.length,
                payments,
            });
        } catch (error) {
            console.error("Get my payments error:", error);

            return res.status(500).json({
                message: "Failed to fetch your payments",
            });
        }
    },

    getPaymentById: async (req, res) => {
        try {
            const payment = await Payment.findById(req.params.id)
                .populate("booking")
                .populate("user", "-password");

            if (!payment) {
                return res.status(404).json({
                    message: "Payment not found",
                });
            }

            const currentUser = await User.findById(req.userId);

            const isAdmin =
                currentUser &&
                ["admin", "receptionist"].includes(currentUser.role);

            const isOwner =
                payment.user._id.toString() === req.userId.toString();

            if (!isOwner && !isAdmin) {
                return res.status(403).json({
                    message: "You are not allowed to view this payment",
                });
            }

            return res.status(200).json({
                payment,
            });
        } catch (error) {
            console.error("Get payment error:", error);

            return res.status(500).json({
                message: "Failed to fetch payment",
            });
        }
    },

    getAllPayments: async (req, res) => {
        try {
            const payments = await Payment.find()
                .populate("booking")
                .populate("user", "-password")
                .sort({ createdAt: -1 });

            return res.status(200).json({
                count: payments.length,
                payments,
            });
        } catch (error) {
            console.error("Get all payments error:", error);

            return res.status(500).json({
                message: "Failed to fetch payments",
            });
        }
    },

    updatePaymentStatus: async (req, res) => {
        try {
            const { status } = req.body;

            const validStatuses = ["pending", "completed", "failed"];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid payment status",
                });
            }

            const payment = await Payment.findById(req.params.id);

            if (!payment) {
                return res.status(404).json({
                    message: "Payment not found",
                });
            }

            payment.paymentstatus = status;

            if (status === "completed") {
                payment.paidat = new Date();
            }

            await payment.save();

            const bookingStatus =
                status === "completed"
                    ? "paid"
                    : status === "failed"
                        ? "failed"
                        : "pending";

            await Booking.findByIdAndUpdate(payment.booking, {
                paymentstatus: bookingStatus,
            });

            return res.status(200).json({
                message: "Payment status updated successfully",
                payment,
            });
        } catch (error) {
            console.error("Update payment status error:", error);

            return res.status(500).json({
                message: "Failed to update payment status",
            });
        }
    },
};

module.exports = paymentController;
