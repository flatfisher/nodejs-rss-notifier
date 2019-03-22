# nodejs-rss-notifier
RSSの内容を取得し更新されていたらLINEに通知するサンプルです

## Warning
これはあくまでサンプルです。リファクタリングや細い認証など行っていないので自己責任でお試しください。

## Prerequirement
- Node.js
- gcloud command
- GCP Account
- LINE Notifyのaccess_token
    - https://notify-bot.line.me/doc/ja/

## GCP Products
- Google App Engine 2nd gen Node.js
- Cloud Tasks
- Cloud Scheduler
- Cloud Datastore

## Preparation and deployment

### RSSのURLをDatastoreに登録する

```
$ npm install
```

```
'use strict';

async function saveFeed(url) {
    const Datastore = require('@google-cloud/datastore');
    const datastore = new Datastore({
        projectId: '',
    });
    const feed = {
        key: datastore.key(['Feed']),
        data: {
            url: url,
            date: new Date() //この日時が最終更新日時となる
        },
    };
    return await datastore.save(feed)
}

//GKEのリリースノート
saveFeed("https://cloud.google.com/feeds/kubernetes-engine-release-notes.xml").catch((err) => console.error(err));
```

### app.yamlの編集

```
LINE_AUTHORIZATION: 'LINE Notifyのaccess_tokenを入れる'
```


### Deploy

```
// Cloud Tasksの登録
$ gcloud app deploy queue.yaml

// GAEのデプロイ
$ gcloud app deploy app.yaml

// Schedulerのセット
$ gcloud beta scheduler jobs create app-engine RSS-Notifier --schedule "0 */3 * * *" --time-zone Asia/Tokyo --description "Notify" --service release-note-notifier --relative-url /v1/tasks/make
```