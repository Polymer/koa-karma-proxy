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
import {resolve} from 'path';
import {statSync} from 'fs';

console.log('Karma Proxy wrapper for Karma CLI');

let a = 0;
let karmaProxyConfigFile = './karma.proxy.js';
let usedProxyFileArg = false;
let upstreamProxyServerFactory;

while (a < process.argv.length) {
  const arg = process.argv[a];
  if (arg === '--proxyFile') {
    karmaProxyConfigFile = process.argv[a + 1];
    process.argv.splice(a, 2);
    usedProxyFileArg = true;
    break;
  }
  if (arg.startsWith('--proxyFile=')) {
    karmaProxyConfigFile = process.argv[a].split('=').slice(1).join('=');
    process.argv.splice(a, 1);
    usedProxyFileArg = true;
    break;
  }
  ++a;
}

const {process: processKarmaArgs} = require('karma/lib/cli');
const karmaConfig: karma.ConfigOptions = processKarmaArgs();
const showProxyFileArgumentInfo = () => console.info(
    `You can specify an alternative to the karma.proxy.js default path to proxy config fie by using --proxyFile <path>`);

karmaProxyConfigFile = resolve(karmaProxyConfigFile);
let configFileStat;
try {
  configFileStat = statSync(karmaProxyConfigFile);
} catch (e) {
}

if (!configFileStat || !configFileStat.isFile()) {
  console.error(`No karma proxy module file found at ${karmaProxyConfigFile}`);
  if (!usedProxyFileArg) {
    showProxyFileArgumentInfo();
  }
  process.exit(1);
}

try {
  upstreamProxyServerFactory = require(karmaProxyConfigFile);
} catch (e) {
}

if (!upstreamProxyServerFactory) {
  console.error(
      `Unable to load proxy server config file "${karmaProxyConfigFile}"`);
  if (!usedProxyFileArg) {
    showProxyFileArgumentInfo();
  }
  process.exit(1);
}

(async () => {
  const {upstreamProxyPort} =
      await start(upstreamProxyServerFactory, {karmaConfig});
  console.log(
      `[karma-proxy] Upstream Proxy Server started at ` +
      `http://0.0.0.0:${upstreamProxyPort}/`);
})();
