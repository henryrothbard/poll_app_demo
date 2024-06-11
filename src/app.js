require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('morgan');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error(err));

const redis = require('./configs/redis');

const api = require('./routes/api');
const auth = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(redis.auth.bind(redis));

app.use('/api', api);
app.use('/auth', auth);

app.use((req, res, next) => {
    res.status(404).send("Sorry, can't find that!");
});

app.use((err, req, res, next) => {
    console.error("500 ERROR: ", err.stack);
    res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});