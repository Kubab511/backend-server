const express = require('express');
const cors = require('cors');
const xml2js = require('xml2js');
const db = require('./db.ts');
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    const allowedPattern = /^https?:\/\/[\w\-]+\.barabasz\.dev$/i;
    if (!origin || allowedPattern.test(origin) || origin === 'http://localhost:4200') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
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

app.get('/v1/setup/deer', async (req, res) => {
  try {
    await db.none(`
      DROP TABLE IF EXISTS deer;
      CREATE TABLE deer (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP,
        lat REAL,
        lon REAL
      );
    `);
    res.status(200).json({ message: 'Table deer created successfully' });
  } catch (error) {
    console.error('Error creating deer table:', error);
    res.status(500).json({ error: `Failed to create table: ${error.message}` });
  }
});

app.post('/v1/deer/report', async (req, res) => {
  try {
    const { lat, lon, created_at } = req.body;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return res.status(400).json({ error: 'lat and lon are required and must be numbers' });
    }

    let createdAt = created_at ? new Date(created_at) : new Date();
    if (isNaN(createdAt.getTime())) {
      return res.status(400).json({ error: 'created_at must be a valid date if provided' });
    }

    const report = await db.one(
      'INSERT INTO deer (created_at, lat, lon) VALUES ($1, $2, $3) RETURNING id, created_at, lat, lon',
      [createdAt, lat, lon]
    );

    res.status(201).json({ report });
  } catch (error) {
    console.error('Error creating report: ', error);
    res.status(500).json({ error: `Error creating report: ${error.message}` });
  }
});

app.get('/v1/deer/reports', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [reports, { count }] = await Promise.all([
      db.any(
        'SELECT id, created_at, lat, lon FROM deer ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      ),
      db.one('SELECT COUNT(*) FROM deer')
    ]);

    const total = parseInt(count);

    res.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: `Failed to fetch reports: ${error.message}` });
  }
});

app.get('/v1/deer/reports/today', async (req, res) => {
  try {
    const reports = await db.any(
      `SELECT id, created_at, lat, lon FROM deer
       WHERE created_at >= date_trunc('day', now())
         AND created_at < date_trunc('day', now()) + interval '1 day'
       ORDER BY created_at DESC`
    );

    res.status(200).json({ reports });
  } catch (error) {
    console.error('Error fetching today reports:', error);
    res.status(500).json({ error: `Error fetching reports: ${error.message}` });
  }
});

app.delete('/v1/deer/reports/remove/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const removed = await db.oneOrNone(
      'DELETE FROM deer WHERE id = $1 RETURNING id, created_at, lat, lon',
      [id]
    );

    if (!removed) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.status(200).json({ removed });
  } catch (error) {
    console.error('Error removing report:', error);
    res.status(500).json({ error: `Error removing report: ${error.message}` });
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