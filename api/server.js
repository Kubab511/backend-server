const express = require('express');
const crypto = require('crypto');
const jsonfile = require('jsonfile');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());


const usersFilePath = path.join(__dirname, 'users.json');
const keyPath = path.join(__dirname, 'key.pem')
const key = fs.readFileSync(keyPath, 'utf8');


const loadUsers = async () => {
  try {
    const data = await jsonfile.readFile(usersFilePath);
    return data.users;
  } catch (error) {
    console.error('Error reading users.json:', error);
    throw error;
  }
};


app.post('/api/checkSerial', async (req, res) => {
  const { deviceID, serial } = req.body;

  const users = await loadUsers();
  const user = users.find((user) => user.deviceID === deviceID && user.serial === serial);

  if (!user) {
    return res.status(401).send("");
  }

  var date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(23, 59, 59, 999);
  date = date.toISOString();
  
  let data = {
    deviceID: deviceID,
    expirationDate: date
  };
  data = JSON.stringify(data);

  const sign = crypto.createSign('sha256');
  sign.update(data);
  sign.end();
  const signature = sign.sign(key, 'base64');

  res.json({
    data: {
      deviceID: deviceID,
      expirationDate: date
    },
    signature: signature
  });
});

module.exports = app;