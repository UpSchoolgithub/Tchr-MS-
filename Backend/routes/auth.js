const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const router = express.Router();

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
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
      console.log('User authenticated:', user);

      // Generate JWT token
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role // Ensure role is present in the users.json
      };
      const secret = process.env.JWT_SECRET || 'your_jwt_secret'; // Use a secret key from environment variables
      const options = {
        expiresIn: '1h' // Set the token to expire in 1 hour
      };
      
      const token = jwt.sign(payload, secret, options); // Generate a JWT token

      res.json({ token, user: { username: user.username, email: user.email, role: user.role } });
    } else {
      console.log('Invalid username or password');
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
