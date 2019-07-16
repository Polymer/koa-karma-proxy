const Koa = require('koa')
const mount = require('koa-mount')
const staticFiles = require('koa-static')
const getStream = require('get-stream')

const smileyHeaderMiddleware = async (ctx, next) => {
  await next()
  if (ctx.response.is('html')) {
    ctx.body = `<!-- :) -->${await getAsString(ctx.body)}`
  } else if (ctx.response.is('js')) {
    ctx.body = `/* :) */${await getAsString(ctx.body)}`
  }
}

const getAsString = async (value) => {
  if (Buffer.isBuffer(value)) {
    return value.toString()
  } else if (isStream(value)) {
    return await getStream(value)
  } else if (typeof value === 'string') {
    return value
  } else {
    return ''
  }
}

const isStream = (value) =>
    value !== null && typeof value === 'object' &&
    typeof value.pipe === 'function';

module.exports = (karma) => new Koa()
  .use(mount('/base', new Koa()
    .use(smileyHeaderMiddleware)
    .use(staticFiles('.'))))
  .use(karma)
