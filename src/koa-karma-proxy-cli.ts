import {start} from './koa-karma-proxy';
import karma = require('karma');
import {resolve} from 'path';

const {process} = require('karma/lib/cli');
const config: karma.ConfigOptions = process();

// This may not be the right way to achieve this...  Need to fiddle to get this
// right.
const karmaProxyConfigFile = resolve('./karma.proxy.js');
console.log(karmaProxyConfigFile);
const upsFactory = require(karmaProxyConfigFile);

(async () => {
  const servers = await start(upsFactory, {karmaConfig: config});
  console.log(`Upstream Proxy listening on ${
      servers.upstreamProxyPort} and Karma listening on ${servers.karmaPort}`);
})();
