const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const authrouter = require('./routes/Authroutes');
const userRouter = require('./routes/Userroutes');
const roomRouter = require('./routes/roomroutes');


app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use('/api/v1/auth', authrouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/rooms', roomRouter);

module.exports = app;