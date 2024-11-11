const express = require('express');
const bcrypt = require('bcrypt');
const jsonfile = require('jsonfile');
const path = require('path');
const cors = require('cors');

// Create an Express app
const app = express();
const usersFilePath = path.join(__dirname, 'users.json');

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Load users from JSON file
const loadUsers = async () => {
  try {
    const data = await jsonfile.readFile(usersFilePath);
    return data.users;
  } catch (error) {
    console.error('Error reading users.json:', error);
    throw error;
  }
};

// Define the /login route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const users = await loadUsers();
    const user = users.find((user) => user.username === username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Internal server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export the server as a Vercel-compatible handler
module.exports = app;
