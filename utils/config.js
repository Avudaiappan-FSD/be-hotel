require('dotenv').config();
const MONGODB_URI=process.env.MONGODB_URI;
const PORT=process.env.PORT || 3000;
const JWT_SECRET=process.env.JWT_SECRET;
// const razorpaykeyid=process.env.RAZORPAY_KEY_ID;
// const razorpaykeysecret = process.env.RAZORPAY_KEY_SECRET;

module.exports = {
    MONGODB_URI,
    PORT,
    JWT_SECRET,
    // razorpaykeyid,
    // razorpaykeysecret,

};