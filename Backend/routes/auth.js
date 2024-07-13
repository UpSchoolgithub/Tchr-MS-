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

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Received login request:', { username, password });
    const users = getUsers();
    console.log('Loaded users:', users);
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
      console.log('User authenticated:', user);
      res.json({ token: 'mock-token', user });
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
