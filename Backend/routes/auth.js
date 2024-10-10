const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Utility function to read users from the JSON file
const getUsers = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../users.json'));
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users.json:', error);
    return [];
  }
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Received login request:', { username, password });
    const users = getUsers();
    console.log('Loaded users:', users);
    
    // Find the user by username
    const user = users.find(user => user.username === username);
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Password comparison
    console.log('Comparing passwords');
    if (user.password !== password) {
      console.log('Invalid password');
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate JWT token (you might be using JWT_SECRET)
    console.log('Generating token');
    const payload = { id: user.id, email: user.email };
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const options = { expiresIn: '1h' };
    const token = jwt.sign(payload, secret, options);

    console.log('Login successful');
    res.json({ token, user: { username: user.username, email: user.email } });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
