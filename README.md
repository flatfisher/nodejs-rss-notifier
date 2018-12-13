# nodejs-rss-notifier
RSS Notifier is notify app of RSS, notify somewhere using an HTTP request if there is an update in RSS. For example LINE Notify, Slack Notify

## Prerequirement
- Node.js
- gcloud command
- GCP Account

## GCP Products
- Google App Engine 2nd gen Node.js
- Cloud Tasks
- Cloud Scheduler
- Cloud Datastore

## Deploy

```
$ gcloud app deploy app.yaml
```