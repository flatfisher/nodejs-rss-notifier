'use strict';

const projectId = process.env.GOOGLE_CLOUD_PROJECT;

// Preparing GCP libraries
const FEED_KIND = 'Feed';
const Datastore = require('@google-cloud/datastore');
const CloudTasks = require('@google-cloud/tasks');
const { Translate } = require('@google-cloud/translate');

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
    console.info(`App listening on port ${PORT}`);
    console.info('Started');
});

// Handlers
app.get('/', (_, res) => {
    res.status(200).send('Hello, world!').end();
});

// README: Create task as many as the number of feeds registered in Datastore
app.post('/v1/tasks/make', async (_, res) => {
    const addResult = await addFeedTask().catch((err) => res.status(500).send({ msg: 'Cloud Tasks registration failed' }).end())
    res.status(200).send('success').end();
});

// README: Notify LINE when RSS is updated
app.post('/v1/tasks/notify', async (req, res) => {
    const buff = new Buffer.from(req.body, 'base64');
    const url = buff.toString('ascii');
    const rssResult = await readRss(url).catch((err) => res.status(500).send({ msg: `RSS failed: ${err}` }).end())
    let msg = 'success';
    if (rssResult.isUpdated) {
        const notifyResult = await notify(rssResult).catch((err) => res.status(500).send({ msg: 'Notification failed' }).end());
        const updateResult = await updateLastModified(rssResult, url).catch((err) => res.status(500).send({ msg: 'Update failed' }).end());
    } else {
        msg = 'There is no update';
    }
    res.status(200).send({ msg: msg }).end();
});

// Cloud Datastore
// README: Read multiple feed urls
async function addFeedTask() {
    const datastore = new Datastore({
        projectId: projectId,
    });
    const query = datastore.createQuery('Feed')
    const results = await datastore.runQuery(query)
    const feeds = results[0]
    feeds.forEach(feed => {
        addTask(feed.url)
    })
}

// Cloud Tasks
// README: Make a task
async function addTask(url) {
    const client = new CloudTasks.CloudTasksClient();
    const options = { payload: url };
    const task = {
        appEngineHttpRequest: {
            httpMethod: 'POST',
            relativeUri: '/v1/tasks/notify',
        },
    };
    task.appEngineHttpRequest.body = Buffer.from(options.payload).toString(
        'base64'
    );
    const queue = 'notify-queue';
    const location = 'us-central1';
    const parent = client.queuePath(projectId, location, queue);
    const request = {
        parent: parent,
        task: task,
    };
    return client.createTask(request)
}

// README: Read RSS and flag it when there is an update
async function readRss(url) {
    const Parser = require('rss-parser');
    const parser = new Parser();
    const feed = await parser.parseURL(url);
    const originalText = feed.items[0].contentSnippet.replace(/(\r\n\t|\n|\r\t)/gm, "");
    const date = feed.items[0].isoDate;

    let response = {
        text: originalText,
        translation: '',
        link: feed.items[0].link,
        key: '', //Feed Key
        isUpdated: false,
        date: date,
    }

    // Get RSS Last Acquisition Date
    const datastore = new Datastore({
        projectId: projectId,
    });
    const query = datastore.createQuery('Feed').filter('url', '=', url);
    const datastoreResults = await datastore.runQuery(query);

    //If RSS is updated, create responses for updated content and translated text
    const isUpdated = Date.parse(date.toString()) > Date.parse(datastoreResults[0][0].date.toString());
    if (isUpdated) {
        const translate = new Translate({
            projectId: projectId,
        });
        let translateResult = await translate.translate(originalText, 'ja')
        if (!translateResult.err) {
            response.key = datastoreResults[0][0][datastore.KEY];
            response.translation = translateResult[0];
            response.isUpdated = true;
        }
    }
    return response
}

// README: Notify LINE
async function notify(rssResult) {
    const auth = process.env.LINE_AUTHORIZATION;
    let request = require('request');
    let options = {
        url: 'https://notify-api.line.me/api/notify',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + auth
        },
        json: true,
        form: { 'message': '' }
    }
    options.form.message = rssResult.text + "\n\n\n" + rssResult.translation + "\n\n" + rssResult.link;
    request(options, function (error, response, body) {
        return body
    })
}

// README: Save the last read date
async function updateLastModified(rssResult, url) {
    const datastore = new Datastore({
        projectId: projectId,
    });
    const feed = {
        key: rssResult.key,
        data: {
            date: new Date(),
            url: url,
        },
    };
    return await datastore.save(feed)
}