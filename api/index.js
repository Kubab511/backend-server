const express = require('express');
const cors = require('cors');
const xml2js = require('xml2js');
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    const allowedPattern = /^https?:\/\/[\w\-]+\.barabasz\.dev$/i;
    if (!origin || allowedPattern.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true,
};

const parser = new xml2js.Parser({ explicitArray: false });

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

app.get('/v1/luas', async (req, res) => {
  const { action = 'forecast', stop, encrypt = 'false', format = 'json' } = req.query;
  
  if (!stop) {
    return res.status(400).json({ error: 'Stop parameter is required' });
  }
  
  const requestURL = `https://luasforecasts.rpa.ie/xml/get.ashx?action=${action}&stop=${stop}&encrypt=${encrypt}`;

  try {
    const response = await fetch(requestURL);
    const xmlText = await response.text();
    
    if (format === 'xml') {
      return res.status(200).type('text/xml').send(xmlText);
    }
    
    const result = await parser.parseStringPromise(xmlText);
    const stopInfo = result.stopInfo;
    
    const jsonResponse = {
      stop: {
        name: stopInfo.$.stop,
        abbreviation: stopInfo.$.stopAbv,
        created: stopInfo.$.created
      },
      message: stopInfo.message || null,
      directions: []
    };
    
    const directions = Array.isArray(stopInfo.direction) ? stopInfo.direction : [stopInfo.direction];
    
    directions.forEach(direction => {
      if (direction) {
        const directionData = {
          name: direction.$.name,
          trams: []
        };
        
        if (direction.tram) {
          const trams = Array.isArray(direction.tram) ? direction.tram : [direction.tram];
          directionData.trams = trams.map(tram => ({
            dueMins: parseInt(tram.$.dueMins) || tram.$.dueMins,
            destination: tram.$.destination
          }));
        }
        
        jsonResponse.directions.push(directionData);
      }
    });
    
    res.status(200).json(jsonResponse);
    
  } catch (error) {
    console.error('Error fetching or parsing Luas data:', error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;