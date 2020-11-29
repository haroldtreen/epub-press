<p align="center"><img src="https://cloud.githubusercontent.com/assets/1745854/14191006/397082b2-f75b-11e5-9f5b-6016d069556b.png"/>
</p>

# epub-press

![Build](https://github.com/haroldtreen/epub-press/workflows/Build/badge.svg?branch=master)
<a href="https://codeclimate.com/github/haroldtreen/epub-press/maintainability"><img src="https://api.codeclimate.com/v1/badges/444d1c975273b32ee0f1/maintainability" /></a>

> Backend server for [EpubPress](https://epub.press).

For clients, see [epub-press-clients](https://github.com/haroldtreen/epub-press-clients).

## Usage

You may use docker-compose to stand up both the epub-press server and the backing PostgreSQL database.

1.  Follow the [Install Dependencies](#install-dependencies) step
1.  [Install Docker](https://docs.docker.com/engine/installation/)
1.  `docker-compose up`

You'll also want to run database migrations if it's your first time running the service:

`npx sequelize-cli db:migrate`

EpubPress will be running at `http://localhost:3000`.

## Development Setup

Clone this repository and install npm dependencies. Use the node version indicated 
in `.nvmrc`.

#### Install dependencies
```bash
$ git clone https://github.com/haroldtreen/epub-press
$ cd epub-press
$ # optional nvm use
$ npm install
```

You may develop this project backed by a PostgreSQL or SQLite database. 

1.  [Install Docker](https://docs.docker.com/engine/installation/)
    1. With postgres `docker-compose up postgres`
    1. With Sqlite `echo DB_DIALECT=sqlite > .env.local`
1.  `npm start`

For either database type you'll want to run database migrations one time:

`npx sequelize-cli db:migrate`

EpubPress will be running at `http://localhost:3000` and reload upon file changes.

To build a version of EpubPress that talks to a local server, see
[epub-press-chrome](https://github.com/haroldtreen/epub-press-clients/tree/master/packages/epub-press-chrome#usage-with-local-server).

### Tests

```bash
npm run test:integration   # Test API + full article extraction
npm run test:models        # Test models
npm run test:unit          # Test regular JS
npm run test               # Test all of the above
```

Changes should be accompanied by tests. All tests located in `/tests`.

### API Documentation

API Documentation is [here](./API.md).

#### Simple workflow
```sh
$ # create a book
$ curl http://localhost:3000/api/v1/books \
 -H "Content-Type: application/json" \
 -X POST \
 -d '{
    "title": "A title",
    "description": "A description",
    "author": "An author",
    "genre": "ebooks",
    "coverPath": "",
    "urls": [
        "https://epub.press"
    ]
}'

{"id":"RXyGKmTq7"}
$ # download the book as epub file 
$ curl -o book.ebub http://localhost:3000/api/v1/books/RXyGKmTq7/download
$ # or download as mobi file
$ curl -o book.mobi "http://localhost:3000/api/v1/books/RXyGKmTq7/download?filetype=mobi"
$ ls
book.ebub
```

### Environment variables

| Name                   | Default            | Description                       |
|------------------------|--------------------|-----------------------------------|
| `MAIL_SERVER_HOST`     |                    | Hostname of SMTP mail server      |
| `MAIL_SERVER_PORT`     |                    | Port of SMTP mail server          |
| `MAIL_SERVER_USERNAME` |                    | Username for SMTP authentication  |
| `MAIL_SERVER_PASSWORD` |                    | Password for SMTP authentication  |
| `MAIL_SENDER_ADDRESS`  | noreply@epub.press | Sender email address              |
