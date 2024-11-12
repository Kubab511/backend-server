const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());

app.get('/api/v1/:request', (req, res) => {
  res.set('Content-Type', 'text/plain')

  var username = req.query.request.split("|")[0];
  var serial = req.query.request.split("|")[1];

  if (username == "Kubab511" && serial == "ABD7BE") {
    res.status(200).send("OK");
  } else {
    res.status(404).send("Invalid username or serial");
  }

});

module.exports = app;