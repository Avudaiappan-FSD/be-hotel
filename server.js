const mongoose = require('mongoose');
const { MONGODB_URI, PORT } = require('./utils/config');
const app = require('./app');


console.log('Connecting to the database...');
mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('Connected to the database.');

    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.error('Error connecting to database:', err);
});