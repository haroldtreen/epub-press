function MockContentDownloader(overrides) {
    const defaults = {
        isComplete: () => true,
        download: () => Promise.resolve(),
    };

    return { ...defaults, ...overrides };
}

module.exports = MockContentDownloader;
