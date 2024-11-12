const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());

app.get('/api/v1/:request', (req, res) => {
  res.set('Content-Type', 'text/plain')

  var request_body = String(req.params.request);

  const username = request_body.split("|")[1];
  const serial = request_body.split("|")[0];

  if (username == "Kubab511" && serial == "Valhalla") {
    res.status(200).send("OK");
  } else {
    res.status(404).send("Invalid username or serial");
  }

});

module.exports = app;