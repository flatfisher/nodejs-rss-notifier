'use strict';

// Start server
const bodyParser = require('body-parser')
const express = require('express');
const PORT = process.env.PORT || 8080;
const app = express();
app.enable('trust proxy');
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Started');
});

// Handlers
app.get('/', (_, res) => {
    res.status(200).send('Hello, world!').end();
});