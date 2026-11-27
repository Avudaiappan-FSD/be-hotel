require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const razorpaykeyid = process.env.razorpaykeyid;
const razorpaykeysecret = process.env.razorpaykeysecret;
const EMAIL_FROM = process.env.EMAIL_FROM;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

module.exports = {
    MONGODB_URI,
    PORT,
    JWT_SECRET,
    razorpaykeyid,
    razorpaykeysecret,
    EMAIL_FROM,
    RESEND_API_KEY
};

