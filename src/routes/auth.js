const express = require('express');
const asyncHandler = require('../utils/asyncHandler');

const userModel = require('../models/user');
const redis = require('../configs/redis');

const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,64}$/;
const userRegex = /^[a-z0-9._-]{3,26}$/;

const router = express.Router();

router.post('/login', asyncHandler(async (req, res) => {
  const username = req.body.username.toLowerCase();
  const password = req.body.password;
  const user = await userModel.findOne({username: username});
  if (user && await user.verifyPassword(password)) {
    const token = await redis.newSession(username);
    res.set({ 'Authorization' : `${username} ${token}` });
    return res.status(204).send();
  }
  res.status(401).send('Invalid username or password');
}));

router.post('/logout', asyncHandler(async (req, res) => {
  await redis.removeSession(req.session.id);
  res.status(204).send();
}));

router.post('/register', asyncHandler(async (req, res) => {
    const username = req.body.username.toLowerCase();
    const password = req.body.password;

    if (!userRegex.test(username)) return res.status(400).send('Invalid Username');
    if (!passRegex.test(password)) return res.status(400).send('Invalid Password');

    const user = await userModel.findOne({ username: username });
    if (user) return res.status(400).send('User already exists');

    await userModel.create({ username, password });
    res.status(200).send({username, password});
}));

router.get('/test', (req, res) => {
  if (!req.session.username) res.status(401).send('Unauthorized');
  res.send(req.session);
});

module.exports = router;