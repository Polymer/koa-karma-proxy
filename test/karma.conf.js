const { resolve } = require('path')
module.exports = (config) => {
  config.set({
    frameworks: ['jasmine'],
    files: [
      { pattern: resolve('./test/*.test.js'), type: 'module', included: true, served: true }
    ]
  })
}
