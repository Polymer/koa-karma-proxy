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

// import {stopper} from 'karma';
import {stopper} from 'karma';
import * as path from 'path';
import request from 'supertest';
import test from 'tape';

import {start} from '../karma-proxy';

const upstreamProxyServerFactory = require('../../test/karma.proxy.js');

test('starts a proxy server and karma server and it works', async (t) => {
  t.plan(2);
  const {karmaPort, upstreamProxyServer} =
      await start(upstreamProxyServerFactory, {
        karmaConfig: {
          basePath: path.join(__dirname, '../..'),
          files: [{pattern: './test/*.js', included: false, served: true}]
        }
      });

  const responseText =
      (await request(upstreamProxyServer).get('/base/example.js')).text;

  upstreamProxyServer.close(() => {
    stopper.stop({port: karmaPort}, () => {
      t.isNotEqual(responseText, undefined, `Response text should be defined`);
      t.equal(
          responseText,
          '/* :) */something();\n',
          `Response text should contain the prepended content`);
    });
  });
});
