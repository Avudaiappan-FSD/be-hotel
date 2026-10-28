const crypto = require("crypto");
const Razorpay = require("razorpay");
const Room = require("../models/Room")
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { razorpaykeyid, razorpaykeysecret } = require("../utils/config");

let razorpay = null;

const getRazorpay = () => {
    if (!razorpaykeyid || !razorpaykeysecret) {
        return null;
    }

    if (!razorpay) {
        razorpay = new Razorpay({
            key_id: razorpaykeyid,
            key_secret: razorpaykeysecret,
        });
    }

    return razorpay;
};

const paymentController = {

    createOrder: async (req, res) => {
        try {
            const {
                roomId,
                checkin,
                checkout,
                numberofguests
            } = req.body;

            // Validate required fields
            if (!roomId || !checkin || !checkout || !numberofguests) {
                return res.status(400).json({
                    message: "Room, check-in, check-out and guests are required"
                });
            }

            const checkInDate = new Date(checkin);
            const checkOutDate = new Date(checkout);
            const guests = Number(numberofguests);

            if (
                Number.isNaN(checkInDate.getTime()) ||
                Number.isNaN(checkOutDate.getTime()) ||
                checkInDate >= checkOutDate ||
                checkInDate < new Date(new Date().setHours(0, 0, 0, 0)) ||
                !Number.isInteger(guests) ||
                guests < 1
            ) {
                return res.status(400).json({
                    message: "Invalid booking dates or guest count"
                });
            }

            // Find room
            const roomDetails = await Room.findById(roomId);

            if (!roomDetails) {
                return res.status(404).json({
                    message: "Room not found"
                });
            }

            // Check existing confirmed bookings for overlapping dates
            const overlappingBooking = await Booking.findOne({
                room: roomId,
                bookingstatus: "confirmed",
                checkin: { $lt: checkOutDate },
                checkout: { $gt: checkInDate }
            });

            if (overlappingBooking) {
                return res.status(409).json({
                    message: "This room is already booked for the selected dates"
                });
            }

            // Calculate total price on the backend
            const nights = Math.ceil(
                (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
            );

            const pricePerNight = Number(roomDetails.price);
            const totalAmount = nights * pricePerNight;

            if (
                !Number.isFinite(pricePerNight) ||
                pricePerNight <= 0 ||
                !Number.isFinite(totalAmount) ||
                totalAmount <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid room price"
                });
            }

            const razorpayClient = getRazorpay();

            if (!razorpayClient) {
                return res.status(503).json({
                    message: "Razorpay keys are not configured yet",
                });
            }
            // Create Razorpay order only. Do not create a booking yet.
            const order = await razorpay.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: "INR",
                receipt: `room_${roomId}_${Date.now()}`,
                notes: {
                    userId: req.userId.toString(),
                    roomId: roomId.toString(),
                    checkin: checkInDate.toISOString(),
                    checkout: checkOutDate.toISOString(),
                    numberofguests: String(guests),
                    totalprice: String(totalAmount)
                }
            });

            return res.status(201).json({
                message: "Payment order created",
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: razorpaykeyid
            });

        } catch (error) {
            console.error("Create order error:", error);

            return res.status(500).json({
                message: "Failed to create payment order"
            });
        }
    },

    verifyPayment: async (req, res) => {
        let createdBookingId = null;

        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = req.body;

            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature
            ) {
                return res.status(400).json({
                    message: "Payment details are required"
                });
            }

            // 1. Check if this order was already processed
            const existingPayment = await Payment.findOne({
                razorpayorderid: razorpay_order_id
            });

            if (existingPayment) {
                if (
                    existingPayment.user.toString() ===
                    req.userId.toString()
                ) {
                    return res.status(200).json({
                        success: true,
                        message: "Payment already processed",
                        booking: existingPayment.booking,
                        payment: existingPayment
                    });
                }

                return res.status(403).json({
                    message: "You are not allowed to verify this payment"
                });
            }

            // 2. Fetch order from Razorpay
            const order = await razorpay.orders.fetch(
                razorpay_order_id
            );

            if (!order) {
                return res.status(404).json({
                    message: "Razorpay order not found"
                });
            }

            // 3. Verify signature using the configured secret
            const expectedSignature = crypto
                .createHmac("sha256", razorpaykeysecret)
                .update(
                    `${razorpay_order_id}|${razorpay_payment_id}`
                )
                .digest("hex");

            const expectedBuffer = Buffer.from(
                expectedSignature,
                "hex"
            );

            const receivedBuffer = Buffer.from(
                razorpay_signature,
                "hex"
            );

            if (
                expectedBuffer.length !== receivedBuffer.length ||
                !crypto.timingSafeEqual(
                    expectedBuffer,
                    receivedBuffer
                )
            ) {
                return res.status(400).json({
                    message: "Invalid payment signature"
                });
            }

            // 4. Confirm the Razorpay order belongs to this user
            const notes = order.notes || {};

            if (String(notes.userId) !== String(req.userId)) {
                return res.status(403).json({
                    message: "You are not allowed to verify this payment"
                });
            }

            // 5. Fetch actual payment details from Razorpay
            const razorpayPayment =
                await razorpay.payments.fetch(
                    razorpay_payment_id
                );

            if (
                razorpayPayment.order_id !== razorpay_order_id ||
                razorpayPayment.status !== "captured" ||
                order.status !== "paid" ||
                razorpayPayment.amount !== order.amount ||
                razorpayPayment.currency !== order.currency
            ) {
                return res.status(400).json({
                    message: "Payment is not captured or details do not match"
                });
            }

            // 6. Read booking details saved in createOrder notes
            const {
                roomId,
                checkin,
                checkout,
                numberofguests,
                totalprice
            } = notes;

            if (
                !roomId ||
                !checkin ||
                !checkout ||
                !numberofguests ||
                !totalprice
            ) {
                return res.status(400).json({
                    message: "Booking details are missing from the order"
                });
            }

            const checkInDate = new Date(checkin);
            const checkOutDate = new Date(checkout);
            const guests = Number(numberofguests);
            const amount = Number(totalprice);

            if (
                Number.isNaN(checkInDate.getTime()) ||
                Number.isNaN(checkOutDate.getTime()) ||
                checkInDate >= checkOutDate ||
                !Number.isInteger(guests) ||
                guests < 1 ||
                !Number.isFinite(amount) ||
                amount <= 0 ||
                Math.round(amount * 100) !== order.amount
            ) {
                return res.status(400).json({
                    message: "Invalid booking details or amount"
                });
            }

            // 7. Find room
            const roomDetails = await Room.findById(roomId);

            if (!roomDetails) {
                return res.status(404).json({
                    message: "Room not found"
                });
            }

            // 8. Recheck availability before confirming booking
            const overlappingBooking = await Booking.findOne({
                room: roomDetails._id,
                bookingstatus: {
                    $in: ["pending", "confirmed"]
                },
                checkin: { $lt: checkOutDate },
                checkout: { $gt: checkInDate }
            });

            if (overlappingBooking) {
                return res.status(409).json({
                    message:
                        "Payment was received, but the room is no longer available. Please contact support for a refund."
                });
            }

            // 9. Create booking only after verified payment
            const newBooking = await Booking.create({
                user: req.userId,
                room: roomDetails._id,
                roomnumber: roomDetails.roomnumber,
                checkin: checkInDate,
                checkout: checkOutDate,
                numberofguests: guests,
                totalprice: amount,
                bookingstatus: "confirmed",
                paymentstatus: "paid"
            });

            createdBookingId = newBooking._id;

            // 10. Save payment linked to the newly created booking
            const newPayment = await Payment.create({
                booking: newBooking._id,
                user: req.userId,
                amount: amount,
                paymentstatus: "completed",
                razorpayorderid: razorpay_order_id,
                razorpaypaymentid: razorpay_payment_id,
                razorpaysignature: razorpay_signature,
                paymentmethod: "razorpay",
                paidat: new Date()
            });

            return res.status(200).json({
                success: true,
                message: "Payment successful and booking confirmed",
                booking: newBooking,
                payment: newPayment
            });

        } catch (error) {
            console.error("Verify payment error:", error);

            // Cleanup booking if saving its payment record failed
            if (createdBookingId) {
                try {
                    await Booking.findByIdAndDelete(
                        createdBookingId
                    );
                } catch (cleanupError) {
                    console.error(
                        "Booking cleanup error:",
                        cleanupError
                    );
                }
            }

            return res.status(500).json({
                message: "Unable to complete booking verification"
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
