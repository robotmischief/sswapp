//initial setup
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();
const app = express();
const port = process.env.PORT  || 3000;
app.listen(port, () => console.log('listening to port ', port));
//static content
app.use(express.static('public'));