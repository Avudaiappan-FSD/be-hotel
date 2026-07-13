const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/config');

const auth = {
    checkAuth: (req, res, next) => {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Access denied" });
        }
       jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(401).json({ message: "Invalid token" });
            }
            req.userId = user.id;
            next();
        });
    }
};
module.exports = auth;