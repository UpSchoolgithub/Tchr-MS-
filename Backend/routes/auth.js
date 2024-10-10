const express = require('express');
const fs = require('fs');
const path = require('path');
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

// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Received login request:', { username, password });
    const users = getUsers();
    console.log('Loaded users:', users);
    
    // Find user by username
    const user = users.find(user => user.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
      console.log('User authenticated:', user);
      
      // Generate JWT token
      const payload = { id: user.id, email: user.email };
      const secret = process.env.JWT_SECRET || 'your_jwt_secret'; // Ensure your .env file has JWT_SECRET set
      const options = { expiresIn: '1h' };
      const token = jwt.sign(payload, secret, options);

      res.json({ token, user: { username: user.username, email: user.email } });
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
