'use strict';
const kind = 'Feed';
const projectId = process.env.GOOGLE_CLOUD_PROJECT;

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

// Preparing Cloud Datastore
const Datastore = require('@google-cloud/datastore');
const datastore = new Datastore({
    projectId: projectId,
});

// Handlers
app.get('/', (_, res) => {
    res.status(200).send('Hello, world!').end();
});

// Functions

// Cloud Datastore
// Read Feed url
async function addFeedTask() {
    const query = datastore.createQuery(kind)
    const results = await datastore.runQuery(query)
    const feeds = results[0]
    feeds.forEach(feed => {
        console.log(feed)
    })
}