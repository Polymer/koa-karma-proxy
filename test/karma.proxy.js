/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * This file is loaded by the karma-proxy cli and it defines a simple
 * proxy server which mounts some middleware under the '/base' path
 * to serve up static files from the current "./test" directory and
 * prepends a smiley face to each one in a comment.  Anything outside
 * the "/base" path in the URL is proxied to karma.
 */
module.exports = (karma) => {
  return new Koa()
    .use(mount(
      '/base',
      new Koa()
        .use(smileyHeaderMiddleware)
        .use(staticFiles(resolve(__dirname)))))
    .use(karma);
};
 
const {resolve} = require('path');
const Koa = require('koa');
const mount = require('koa-mount');
const staticFiles = require('koa-static');
const getStream = require('get-stream');

const smileyHeaderMiddleware = async (ctx, next) => {
  await next()
  if (ctx.response.is('html')) {
    ctx.body = `<!-- :) -->${await getAsString(ctx.body)}`
  }
  else if (ctx.response.is('js')) {
    ctx.body = `/* :) */${await getAsString(ctx.body)}`
  }
};

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
};

const isStream = (value) => value !== null && typeof value === 'object' &&
    typeof value.pipe === 'function';

