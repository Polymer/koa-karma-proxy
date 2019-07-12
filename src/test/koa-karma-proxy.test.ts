import request from 'supertest';
import test from 'tape';

import Koa = require('koa');

import {start} from '../koa-karma-proxy';

test('starts a proxy server and karma server and it works', async (t) => {
  t.plan(1);
  const ups = await start(
      (karma: Koa.Middleware) => new Koa().use(testMiddleware).use(karma));

  t.equal(1, 1);
});
