'use strict';

module.exports = {
    up: (queryInterface) =>
        queryInterface.bulkInsert(
            'books',
            [
                {
                    id: 1,
                    title: 'Seed Book 1',
                    sections: JSON.stringify([
                        { title: 'Colombia', url: 'http://wikitravel.org/en/Colombia' },
                    ]),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 2,
                    title: 'Seed Book 2',
                    sections: JSON.stringify([
                        { title: 'Ecuador', url: 'http://wikitravel.org/en/Ecuador' },
                    ]),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            {}
        ),
    down: (queryInterface) => queryInterface.bulkDelete('books', [], {}),
};
