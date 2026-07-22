const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/config');
const User = require('../models/User');
const userController = require('../controllers/userController');

const auth = {
    checkAuth: (req, res, next) => {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Access denied" });
        }
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Invalid token" });
            }
            req.userId = decoded.id;
            next();
        });
    },

    allowroles: (roles) => {
        return async(req, res, next) => {
            const userid = req.userId;
            const user = await User.findById(userid);
            if (!roles.includes(user.role)) {
                return res.status(403).json({ message: "Forbidden" });
            }
            next();
        };
    }
};
module.exports = auth;