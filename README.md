<p align="center"><img src="https://cloud.githubusercontent.com/assets/1745854/14191006/397082b2-f75b-11e5-9f5b-6016d069556b.png"/>
</p>

# epub-press

[![CircleCI](https://circleci.com/gh/haroldtreen/epub-press.svg?style=svg)](https://circleci.com/gh/haroldtreen/epub-press)
<a href="https://codeclimate.com/github/haroldtreen/epub-press/maintainability"><img src="https://api.codeclimate.com/v1/badges/444d1c975273b32ee0f1/maintainability" /></a>

> Backend server for [EpubPress](https://epub.press).

For clients, see [epub-press-clients](https://github.com/haroldtreen/epub-press-clients).

### Setup

```bash
git clone https://github.com/haroldtreen/epub-press
cd epub-press
npm install
```

### Usage

**Docker Setup**

1.  [Install Docker](https://docs.docker.com/engine/installation/)
1.  `docker-compose up`

You'll also want to run database migrations if it's your first time running the service:

`npx sequelize-cli db:migrate`

EpubPress will be running at `http://localhost:3000`.

**Development Setup**

1.  [Install Docker](https://docs.docker.com/engine/installation/)
1.  `docker-compose up postgres`
1.  `npm start`

You'll also want to run database migrations if it's your first time running the service:

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

### API

| Description                               | Endpoint                         |
| ----------------------------------------- | -------------------------------- |
| Create a book                             | `POST /api/v1/books`             |
| Check the status of an in progress book   | `GET /api/v1/books/:id/status`   |
| Download an ebook as a file               | `GET /api/v1/books/:id/download` |
| Send the ebook to an email                | `GET /api/v1/books/:id/email`    |
| Check versions compatible with the server | `GET /api/v1/version`            |

### Environment variables

 | Name                   | Default            | Description                       |
 |------------------------|--------------------|-----------------------------------|
 | `MAIL_SERVER_HOST`     |                    | Hostname of SMTP mail server      |
 | `MAIL_SERVER_PORT`     |                    | Port of SMTP mail server          |
 | `MAIL_SERVER_USERNAME` |                    | Username for SMTP authentication  |
 | `MAIL_SERVER_PASSWORD` |                    | Password for SMTP authentication  |
 | `MAIL_SENDER_ADDRESS`  | noreply@epub.press | Sender email address              |
