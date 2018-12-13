'use strict';
const kind = 'Feed';
const projectId = process.env.GOOGLE_CLOUD_PROJECT;

// Preparing GCP Products library
const Datastore = require('@google-cloud/datastore');
const datastore = new Datastore({
    projectId: projectId,
});
const CloudTasks = require('@google-cloud/tasks');

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

// Cloud Tasks
// Make a task
async function addTask(url) {
    const client = new CloudTasks.CloudTasksClient();
    const options = { payload: url };
    const task = {
        appEngineHttpRequest: {
            httpMethod: 'POST',
            relativeUri: '/tasks/notify',
        },
    };
    task.appEngineHttpRequest.body = Buffer.from(options.payload).toString(
        'base64'
    );
    const queue = 'rss-notify-queue';
    const location = 'us-central1';
    const parent = client.queuePath(projectId, location, queue);
    const request = {
        parent: parent,
        task: task,
    };
    return await client.createTask(request)
}

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