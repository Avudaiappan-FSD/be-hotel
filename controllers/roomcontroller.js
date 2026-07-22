const Room = require('../models/Room');

const roomController = {
    createroom: async (req, res) => {
        try {
            const { roomnumber, roomtype, price, capacity, description } = req.body;
            const existingRoom = await Room.findOne({ roomnumber: req.body.roomnumber });
            if (existingRoom) {
                return res.status(400).json({ message: "Room already exists" });
            }
            const newRoom = new Room({ roomnumber, roomtype, price, capacity, description });
            await newRoom.save();
            res.status(201).json({ message: "Room created successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    getallrooms: async (req, res) => {
        try {
            const rooms = await Room.find();
            res.status(200).json(rooms);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    getroombyid: async (req, res) => {
        try {
            const room = await Room.findById(req.params.id);
            if (!room) {
                return res.status(404).json({ message: "Room not found" });
            }
            res.status(200).json(room);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    updateroom: async (req, res) => {
        try {
            const { roomnumber, roomtype, price, capacity, description } = req.body;
            const room = await Room.findById(req.params.id);
            if (!room) {
                return res.status(404).json({ message: "Room not found" });
            }
            room.roomnumber = roomnumber;
            room.roomtype = roomtype;
            room.price = price;
            room.capacity = capacity;
            room.description = description;
            await room.save();
            res.status(200).json({ message: "Room updated successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    deleteroom: async (req, res) => {
        try {
            const room = await Room.findByIdAndDelete(req.params.id);
            if (!room) {
                return res.status(404).json({ message: "Room not found" });
            }

            res.status(200).json({ message: "Room deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    available: async (req, res) => {
        try {
            const rooms = await Room.find({ isavailable: true });
            if (!rooms || rooms.length === 0) {
                return res.status(404).json({ message: "No available rooms found" });
            }
            res.status(200).json(rooms);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    searchrooms: async (req, res) => {
        try {
            const { roomnumber, roomtype } = req.body;
            const searchCriteria = {};
            if (roomnumber) {
                searchCriteria.roomnumber = roomnumber;
            }
            if (roomtype) {
                searchCriteria.roomtype = roomtype;
            }
            const rooms = await Room.find(searchCriteria);
            res.status(200).json(rooms);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
module.exports = roomController;