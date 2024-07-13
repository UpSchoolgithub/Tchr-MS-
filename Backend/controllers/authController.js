const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const register = async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).send({ error: 'User already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 8);

    // Create the user
    const user = await User.create({ name, email, phone, role, password: hashedPassword });

    // Generate a JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).send({ user, token });
  } catch (error) {
    console.error('Registration error:', error);  // Log the detailed error
    if (error instanceof sequelize.ValidationError) {
      // Handle validation errors
      return res.status(400).send({ error: 'Validation error', details: error.errors.map(e => e.message) });
    }
    res.status(400).send({ error: 'Registration failed.', details: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Invalid login credentials');
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.send({ user, token });
  } catch (error) {
    res.status(400).send({ error: 'Login failed.' });
  }
};

module.exports = { register, login };
