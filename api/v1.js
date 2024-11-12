const express = require('express');
const app = express();
const cors = require('cors');
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.get('/api/v1/:request', (req, res) => {
  res.set('Content-Type', 'text/plain')

  var decoded_request = atob(String(req.params.request));

  const username = decoded_request.split("|")[0];
  const serial = decoded_request.split("|")[1];

  if (username == "Kubab511" && serial == "Valhalla") {
    res.status(200).send("OK");
  } else {
    res.status(404).send("Invalid username or serial");
  }

});

// module.exports = app;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});