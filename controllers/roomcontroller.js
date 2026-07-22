const Room = require('../models/Room');

const roomController = {
    createroom: async (req, res) => {
        try {
         const { roomnumber, roomtype, price, capacity, description } = req.body;
         const room = new Room({ roomnumber, roomtype, price, capacity, description });
         await room.save();
            res.status(201).json({ message: 'Room created successfully', room });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    getllrooms: async (req, res) => {
        try {
          
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    getroombyid: async (req, res) => {
        try {
           
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    updateroom : async (req, res) => {
        try {
        }catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    deleteroom: async (req, res) => {
        try {
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    available: async (req, res) => {
        try {
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    searchrooms: async (req, res) => {
        try {
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
module.exports = roomController;