module.exports = (config) => {
  config.set({
    frameworks: ['jasmine'],
    files: [
      { pattern: 'browser.test.js', module: true, included: true }
    ]
  })
}
