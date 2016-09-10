class AppErrors {
    static getApiError(name) {
        const errorData = AppErrors.api[name] || AppErrors.api.DEFAULT;
        const error = new Error(errorData.message);
        error.status = errorData.status;

        return error;
    }

    static buildApiResponse(error) {
        const status = error.status || this.getApiError().status;
        const detail = error.message || this.getApiError().message;
        return { status, detail };
    }
}

AppErrors.api = {
    NO_ID_SPECIFIED: { status: '422', message: 'No book id provided.' },
    BOOK_NOT_FOUND: { status: '404', message: 'No book with that id was found.' },
    BOOK_FILE_NOT_FOUND: { status: '404', message: 'This book has been cleaned from the system.' },
    TOO_MANY_ITEMS: { status: '422', message: 'Request contained too many book sections.' },
    NO_SECTIONS_SPECIFIED: { status: '422', message: 'No sections provided.' },
    NOT_FOUND: { status: '404', message: 'Not found.' },
    MALFORMED_REQUEST: { status: '422', message: 'Request was not in a recognized structure.' },
    DEFAULT: { status: '500', message: 'Unknown error.' },
};

module.exports = AppErrors;
