<p align="center"><img src="https://cloud.githubusercontent.com/assets/1745854/14191006/397082b2-f75b-11e5-9f5b-6016d069556b.png"/>
</p>

# epub-press

> Backend server for [EpubPress](https://epub.press).

For clients, see [epub-press-clients](https://github.com/haroldtreen/epub-press-clients).

### Setup

```bash
git clone https://github.com/haroldtreen/epub-press
cd epub-press
npm install
```



### Usage

```bash
npm start
open http://localhost:3000
```

### Tests

```bash
gulp test-integration   # Test API + full article extraction
gulp test-db            # Test models
gulp test-unit          # Test regular JS
gulp test               # Test all of the above
```

Changes should be accompanied by tests. 
All tests located in `/tests`.

## Endpoints

|Description                                | Endpoint                          |
|-------------------------------------------|-----------------------------------|
|Create a book                              |`POST /api/v1/books`               |
|Check the status of an in progress book    |`GET /api/v1/books/:id/status`     |
|Download an ebook as a file                |`GET /api/v1/books/:id/download`   |
|Send the ebook to an email                 |`GET /api/v1/books/:id/email`      |
|Check versions compatible with the server  |`GET /api/v1/version`              |
