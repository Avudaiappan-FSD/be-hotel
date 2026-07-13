const mongoose = require('mongoose');
const customerschema = new mongoose.Schema({
    name:
    {
        type: String,
        required: true
    },

    email:
    {
        type: String, required: true,
        unique: true
    },
    password:
    {
        type: String,
        required: true
    },
    role:
    {
        type: String,
        required: true
    },
    createdAt:
    {
        type: Date,
        default: Date.now
    },
    updatedAt:
    {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('User', userschema, 'users');