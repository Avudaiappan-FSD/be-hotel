const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/config');
const cookieParser = require('cookie-parser');

const authcontroller = {
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ name, email, password: hashedPassword });
            const user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ message: "User already exists" });
            }
            const newuser = new User({ name, email, password: hashedPassword });
            await newuser.save();
            res.status(200).json({ message: "User registered successfully" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            const token = jwt.sign({ id: user._id, role: user.role },JWT_SECRET);
            res.cookie('token', token, { httpOnly: true });
            res.status(200).json({ message: "User logged in successfully" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    logout: async (req, res) => {
        try {
            res.clearCookie('token');
            res.status(200).json({ message: "User logged out successfully" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    me: async (req, res) => {
        try {
            const { userId } = req;
            const user = await User.findById(userId).select('password, ');
            res.status(200).json({ user });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = authcontroller;