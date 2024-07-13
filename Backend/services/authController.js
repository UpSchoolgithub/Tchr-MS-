const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const register = async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = await User.create({ name, email, phone, role, password: hashedPassword });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send({ error: 'Registration failed.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error();
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.send({ user, token });
  } catch (error) {
    res.status(400).send({ error: 'Login failed.' });
  }
};

module.exports = { register, login };
