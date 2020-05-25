class AppErrors {
    static getApiError(error) {
        let name;
        if (typeof error === 'object') {
            name = AppErrors.inferErrorName(error);
        } else {
            name = error;
        }

        const errorData = AppErrors.api[name] || AppErrors.api.DEFAULT;
        const apiError = new Error(errorData.message);
        apiError.status = errorData.status;

        return apiError;
    }

    static buildApiResponse(error) {
        const status = error.status || this.getApiError(error).status;
        const detail = error.message || this.getApiError(error).message;

        return { status, detail };
    }

    static respondWithError(res, error) {
        const response = AppErrors.buildApiResponse(error);
        res.status(response.status).json({ errors: [response] });
    }

    static inferErrorName(error) {
        const patterns = {
            TOO_LARGE_REQUEST: 'request entity too large',
        };

        return Object.keys(patterns).find((key) => RegExp(patterns[key]).test(error.message));
    }

    static invalidBookKey(keyName) {
        return {
            status: '400',
            message: `Request contained an invalid property '${keyName}'`,
        };
    }
}

AppErrors.api = {
    NO_ID_SPECIFIED: { status: '400', message: 'No book id provided.' },
    NO_EMAIL_SPECIFIED: { status: '400', message: 'No email provided.' },
    BOOK_NOT_FOUND: { status: '404', message: 'No book with that id was found.' },
    BOOK_FILE_NOT_FOUND: {
        status: '404',
        message: 'This book has been cleaned from the system.',
    },
    TOO_MANY_ITEMS: {
        status: '422',
        message: 'Request contained too many book sections.',
    },
    TOO_LARGE_REQUEST: {
        status: '422',
        message: 'Request exceeds size limit. Try less items.',
    },
    NO_SECTIONS_SPECIFIED: { status: '400', message: 'No sections provided.' },
    COVER_PATH_INVALID: { status: '400', message: 'coverPath must be http or https' },
    NOT_FOUND: { status: '404', message: 'Not found.' },
    MALFORMED_REQUEST: {
        status: '400',
        message: 'Request was not in a recognized structure.',
    },
    DEFAULT: { status: '500', message: 'Unknown error.' },
};

module.exports = AppErrors;
