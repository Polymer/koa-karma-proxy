import {stopper} from 'karma';
import * as path from 'path';
import request from 'supertest';
import test from 'tape';

import Koa = require('koa');

import {start} from '../koa-karma-proxy';

const testMiddleware: Koa.Middleware =
    async (ctx: Koa.Context, next: Function) => {
  await next();
  ctx.body = `${ctx.body} // :)`;
};

test('starts a proxy server and karma server and it works', async (t) => {
  t.plan(1);
  const {karmaPort, upstreamProxyServer} = await start(
      (karma: Koa.Middleware) => new Koa().use(testMiddleware).use(karma), {
        karmaConfig : {
          basePath : path.join(__dirname, '../..'),
          files : [ {pattern : 'lib/**/*.js', included : false} ]
        }
      });

  const responseText = (await request(upstreamProxyServer)
                            .get('/base/lib/test/koa-karma-proxy.test.js'))
                           .text;

  stopper.stop({port : karmaPort}, () => {
    upstreamProxyServer.close();
    t.assert(responseText.trim().endsWith('// :)'),
             `Response text should contain the appended content`);
  });
});
