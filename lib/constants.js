const Constants = {};

Constants.FILE_TYPES = {
    'image/png': '.png',
    'image/x-png': '.png',
    'image/png;charset=UTF-8': '.png',
    'image/jpg': '.jpg',
    'image/jpeg': '.jpg',
    'image/JPEG': '.jpg',
    'image/jpeg;charset=UTF-8': '.jpg',
    'image/svg+xml': '.svg',
    'image/svg': '.svg',
    'image/gif': '.gif',
};

Constants.INVALID_ATTRIBUTES = [
    'srcset',
    'sizes',
    'rel:buzz_num',
    'epub:type',
    'property',
    'onclick',
    'itemtype',
    'itemscope',
    'itemprop',
    'draggable',
    'data-web-url',
    'data-type',
    'data-tracker-label',
    'data-tracker-category',
    'data-tracker-action',
    'data-tout-type',
    'data-total-count',
    'data-test-id',
    'data-reactid',
    'data-pin-desc',
    'data-pin-credits',
    'data-para-count',
    'data-original',
    'data-node-uid',
    'data-link-name',
    'data-href',
    'data-full-size',
    'data-component',
    'data-chorus-asset-id',
    'aria-label',
];

Constants.VALID_BOOK_METADATA_KEYS = [
    'author',
    'coverPath',
    'description',
    'genre',
    'id',
    'images',
    'language',
    'published',
    'publisher',
    'sequence',
    'series',
    'tags',
    'title',
];


module.exports = Constants;
