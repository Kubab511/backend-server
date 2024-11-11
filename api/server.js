const express = require('express');
const bcrypt = require('bcrypt');
const jsonfile = require('jsonfile');
const path = require('path');
const cors = require('cors');

const app = express();
const usersFilePath = path.join(__dirname, 'users.json');

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000', // Replace with your React app's URL
  methods: ['GET', 'POST'],
  credentials: true
}));

const loadUsers = async () => {
  try {
    const data = await jsonfile.readFile(usersFilePath);
    return data.users;
  } catch (error) {
    console.error('Error reading users.json:', error);
    return [];
  }
};

// Define the /login route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

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
});

module.exports = app;
