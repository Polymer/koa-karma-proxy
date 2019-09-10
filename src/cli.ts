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

import {start} from './karma-proxy';
import karma = require('karma');
import {resolve as resolvePath} from 'path';
import {extractArgv} from './utils';

export const run = (argv: string[]) => new Promise<number>((resolve) => {
  console.log('Karma Proxy wrapper for Karma CLI');
  let upstreamProxyServerFactory;

  const karmaProxyConfigFile =
      resolvePath(extractArgv('--proxyFile', argv) || './karma.proxy.js');

  const proxyHostOption: string = extractArgv('--proxyHost', argv);

  const proxyPortOption: number|undefined = (() => {
    const port = extractArgv('--proxyPort', argv);
    return port ? parseInt(port) : undefined;
  })();

  const {process: processKarmaArgs} = require('karma/lib/cli');

  console.info(
      `  --proxyFile <path>      ${
          karmaProxyConfigFile || 'Default is ./karma.proxy.js'}\n` +
      `  --proxyHost <hostname>  ${
          proxyHostOption || 'Default is localhost'}\n` +
      `  --proxyPort <port>      ${proxyPortOption || 'Default is 9876'}\n`);

  const karmaConfig: karma.ConfigOptions = processKarmaArgs();

  try {
    upstreamProxyServerFactory = require(karmaProxyConfigFile);
  } catch (err) {
    console.error(
        `Unable to load proxy server config file "${
            karmaProxyConfigFile}" due to`,
        err);
    resolve(1);
  }

  (async () => {
    const {upstreamProxyHost, upstreamProxyPort, karmaHost, karmaPort} =
        await start(upstreamProxyServerFactory, {
          upstreamProxyHost: proxyHostOption,
          upstreamProxyPort: proxyPortOption,
          karmaConfig,
          karmaExitCallback: resolve,
        });
    console.log(
        `[karma-proxy] Upstream Proxy Server started at ` +
        `http://${upstreamProxyHost}:${upstreamProxyPort}/ ` +
        `and proxy to karma at ${karmaHost}:${karmaPort}`);
  })();
});
