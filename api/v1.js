const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());

app.get('/api/v1/:request', (req, res) => {
  res.set('Content-Type', 'text/plain')
  if (req.params.request === 'Valhalla') {
    res.status(200).send("OK");
  } else {
    res.status(404).send("Not Found");
  }
});

module.exports = app;