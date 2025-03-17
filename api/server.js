const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: '*', // Allow all origins (or specify frontend URL)
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
};

app.use(express.json());
app.use(cors(corsOptions));

app.get('/v1/weather', async (req, res) => {
  const { lat = 53.35, lon = -6.27, lang = 'en', units = 'metric' } = req.query;
  const apiKey = process.env.WEATHER_API_KEY;
  const requestUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&lang=${lang}&appid=${apiKey}`;

  try {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error fetching weather data' });
    }
    const weatherData = await response.json();
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;