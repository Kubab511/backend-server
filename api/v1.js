const express = require('express');
const jsonfile = require('jsonfile');
const path = require('path');
const cors = require('cors');
const PORT = 3000;
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');

const app = express();
const usersFilePath = path.join(__dirname, 'users.json');

app.use(express.json());
app.use(cors());

const key = 'PZOrs9m79gNU8wmqGiDabfsSbaN77lmknrP1EZsytbGOiUlT/+9hH9d8iECwyBzQ';

const loadUsers = async () => {
  try {
    const data = await jsonfile.readFile(usersFilePath);
    return data.users;
  } catch (error) {
    console.error('Error reading users.json:', error);
    throw error;
  }
};

app.get('/api/v1/:request', async (req, res) => {
  res.set('Content-Type', 'text/plain')

  var request_body = String(req.params.request);

  const serial = request_body.split("|")[0];
  const username = request_body.split("|")[1];
  
  try {
    const users = await loadUsers();
    const user = users.find((user) => user.username === username);

    if (!user || user.blacklisted) {
      return res.status(401).send('Invalid username or password');
    }

    const isSerialValid = await bcrypt.compare(serial, user.serial);
    if (!isSerialValid) {
      return res.status(401).send('Invalid username or password');
    }

    var encrypted = CryptoJS.AES.encrypt(user.username, key);

    res.status(200).send(btoa(encrypted.toString()));
  } catch (error) {
    console.error('Internal server error:', error);
    res.status(500).send('Internal server error');
  }

});

module.exports = app;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });