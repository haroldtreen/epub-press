function MockContentDownloader(overrides) {
  const defaults = {
    isComplete: () => true,
    download: () => Promise.resolve(),
  };

  return Object.assign({}, defaults, overrides);
}

module.exports = MockContentDownloader;
