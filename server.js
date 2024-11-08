const express = require('express');
const app = express();
const port = 3000;

app.get('/api/v1/*', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;