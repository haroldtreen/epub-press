# API

| Description                               | Endpoint                         |
| ----------------------------------------- | -------------------------------- |
| Create a book                             | `POST /api/v1/books`             |
| Check the status of an in progress book   | `GET /api/v1/books/:id/status`   |
| Download an ebook as a file               | `GET /api/v1/books/:id/download` |
| Send the ebook to an email                | `GET /api/v1/books/:id/email`    |
| Check versions compatible with the server | `GET /api/v1/version`            |

View the OAS 3.0 specification [here](./docs/epub-press.yaml)

View OAS 3.0 specification with Swagger UI [here](http://generator3.swagger.io/index.html?url=https://raw.githubusercontent.com/haroldtreen/epub-press/master/docs/epub-press.yaml)
