const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());

app.get('/api/v1/', (req, res) => {
  res.status(200).send('OK');
});

module.exports = app;