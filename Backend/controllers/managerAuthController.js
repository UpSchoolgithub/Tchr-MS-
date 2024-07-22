// controllers/managerAuthController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Manager } = require('../models'); // Adjust the path based on your project structure

// Function to generate a JWT token for Manager
const generateToken = (manager) => {
  const payload = {
    id: manager.id,
    managerId: manager.id, // Ensure this field exists in your manager model
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if the manager already exists
    const existingManager = await Manager.findOne({ where: { email } });
    if (existingManager) {
      return res.status(400).send({ error: 'Manager already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 8);

    // Create the manager
    const manager = await Manager.create({ name, email, phone, password: hashedPassword });

    // Generate a JWT token
    const token = generateToken(manager);

    res.status(201).send({ manager, token });
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
    const manager = await Manager.findOne({ where: { email } });
    if (!manager || !await bcrypt.compare(password, manager.password)) {
      throw new Error('Invalid login credentials');
    }

    const token = generateToken(manager);
    res.send({ manager, token });
  } catch (error) {
    res.status(400).send({ error: 'Login failed.' });
  }
};

module.exports = { register, login };
