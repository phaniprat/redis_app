const express = require('express');
const redis = require('redis');
const axios = require('axios');

const app = express();
const port = 3000;
const redis_port = 6379;

const redisClient = redis.createClient({
  socket: {
    port: redis_port
  }
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

async function startRedisClient() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Error connecting to Redis:', err);
  }
}

app.use(express.json());

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await startRedisClient();
});

app.get('/users', async (req, res) => {
  const apiUrl = 'https://jsonplaceholder.typicode.com/users';

  try {
    const cachedData = await redisClient.get('users');

    if (cachedData) {
      console.log('Sending cached data');
      return res.json(JSON.parse(cachedData));
    } else {
      console.log('Fetching data from API');
      const response = await axios.get(apiUrl);
      const data = response.data;

      await redisClient.setEx('users', 3600, JSON.stringify(data));

      return res.json(data);
    }
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Internal Server Error');
  }
});
