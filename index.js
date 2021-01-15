//initial setup
const { request, response } = require('express');
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();
const app = express();
const port = process.env.PORT  || 3000;
app.listen(port, () => console.log('listening to port ', port));
//static content
app.use(express.static('public'));

//fetch Mars weather data
app.get('/mars', async (request, response) => {
    //TODO: try catch errors
    const apiKey = process.env.API_NASA_KEY;
    const url = `https://api.nasa.gov/insight_weather/?api_key=${apiKey}&feedtype=json&ver=1.0`;
    const data = await fetch(url);
    const json = await data.json();
    response.json(json);
});

//fetch Earth weather location
app.get('/earth/location/:place', async (request, response) => {
    //TODO: try catch errors
    const place = request.params.place;
    const apiKey = process.env.API_WEATHER_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${place}&appid=${apiKey}`;
    const data = await fetch(url);
    const json = await data.json();
    response.json(json);
});
//fetch Earth weather data
app.get('/earth/:latlon', async (request, response) => {
    //TODO: try catch errors
    const apiKey = process.env.API_WEATHER_KEY;
    const location = request.params.latlon.split(',');
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${location[0]}&lon=${location[1]}&exclude=current,minutely,hourly,alerts&units=metric&appid=${apiKey}`;
    const data = await fetch(url);
    const json = await data.json();
    response.json(json);
})