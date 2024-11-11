const express = require('express');
const bcrypt = require('bcrypt');
const jsonfile = require('jsonfile');
const path = require('path');
const { error } = require('console');

const app = express();
const port = 3000;
const usersFilePath = path.join(__dirname, 'users.json'); 

app.use(express.json());

const loadUsers = async () => {
  try {
    const data = await jsonfile.readFile(usersFilePath);
    return data.users;
  } catch {
    console.error('Error reading users file', error);
    return [];
  }
}

app.post("api//login", async (req, res) => {
  const { username, password } = req.body;

  if(!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  const users = await loadUsers();

  const user = users.find(user => user.username === username);
  if(!user) {
    return res.status(401).send('Invalid username or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if(!isPasswordValid) {
    return res.status(401).send("Invalid username or password");
  }

  res.status(200).send('Login successful');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;