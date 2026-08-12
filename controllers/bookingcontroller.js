const booking = require('../models/booking');
const room = require('../models/Room');
const user = require('../models/User');

const bookingcontroller = {
    createBooking: async (req, res) => {
        try {
            const { user:userId, room:roomId, checkin, checkout, numberofguests, totalprice } = req.body;
            const checkIn = new Date(checkin);
            const checkOut = new Date(checkout);
            const roomalrdybooked = await booking.findOne({ room: roomId, checkin: { $lt: checkOut }, checkout: { $gt: checkIn } });
            if (roomalrdybooked) {
                return res.status(400).json({ message: "This Room already booked by someone else" });
            }
            if (checkIn >= checkOut) {
                return res.status(400).json({ message: "Check-in date must be before check-out date" });
            }
            if (checkIn < new Date()) {
                return res.status(400).json({ message: "Check-in date must be in the future" });
            }
            const overlapping = await booking.findOne({
                room: roomId,
                bookingstatus: { $ne: 'cancelled' },
                $or: [
                    { checkin: { $lte: checkIn }, checkout: { $gte: checkOut } }
                ]
            });
            if (overlapping) {
                return res.status(400).json({ message: "This Room is already booked for the selected dates" });
            }
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            const totalPriceCalculated = nights * totalprice;
            const roomDetails = await room.findById(roomId);
            const userDetails = await user.findById(userId);
            const newbooking = await booking.create({
                user: userDetails._id,
                room: roomId,
                roomnumber: roomDetails.roomnumber,
                checkin: checkIn,
                checkout: checkOut,
                numberofguests,
                totalprice: totalPriceCalculated
            });
            const populatedBooking = await booking.findById(newbooking._id)
            .populate('user', 'name email')
            .populate('room', 'roomnumber roomtype price');  

            res.status(201).json({success: true, message: "Booking created successfully", booking: populatedBooking });
        } catch (error) {
            res.status(400).json({ message: error.message });
        };

    },
    getmybookings: async (req, res) => {
        try {
            const userId = req.params.userId;
            const bookings = await booking.find({ user: userId }).populate('user', 'name email')
            .populate('room', 'roomnumber roomtype price');
            res.status(200).json(bookings);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getAllBookings: async (req, res) => {
        try {
            const bookings = await booking.find().populate('user', 'name email').populate('room', 'roomnumber roomtype price');
            res.status(200).json(bookings);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    getBookingById: async (req, res) => {
        try {
            const bookingId = req.params.id;
            const Booking = await booking.findById(bookingId).populate('user', 'name email').populate('room', 'roomnumber roomtype price');
            if (!Booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            res.status(200).json(Booking);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    updateBooking: async (req, res) => {
        try {
            const bookingId = req.params.id;
            const updatedBooking = await booking.findByIdAndUpdate(bookingId, req.body, { new: true }).populate('user', 'name email').populate('room', 'roomnumber roomtype price');
            if (!updatedBooking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            res.status(200).json(updatedBooking);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    deleteBooking: async (req, res) => {
        try {
            const bookingId = req.params.id;
            const deletedBooking = await booking.findByIdAndDelete(bookingId);
            if (!deletedBooking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            res.status(200).json({ message: 'Booking deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = bookingcontroller;