import {start} from './koa-karma-proxy';
import karma = require('karma');
import {resolve} from 'path';

console.log('koa-karma-proxy wrapper');
let a = 0;
let karmaProxyConfigFile = './karma.proxy.js';
while (a < process.argv.length) {
  if (process.argv[a] === '--proxyFile') {
    karmaProxyConfigFile = process.argv[a + 1];
    process.argv.splice(a, 2);
    break;
  }
  if (process.argv[a].startsWith('--proxyFile=')) {
    karmaProxyConfigFile = process.argv[a].split('=').slice(1).join('=');
    process.argv.splice(a, 1);
    break;
  }
  ++a;
}

const {process : processKarmaArgs} = require('karma/lib/cli');
const karmaConfig: karma.ConfigOptions = processKarmaArgs();

// This may not be the right way to achieve this...  Need to fiddle to get this
// right.
karmaProxyConfigFile = resolve(karmaProxyConfigFile);
let upsFactory;
try {
  upsFactory = require(karmaProxyConfigFile);
} catch (e) {
  console.error(
      `Unable to load proxy server config file "${karmaProxyConfigFile}"`);
  process.exit(1);
}

(async () => {
  const {upstreamProxyPort} = await start(upsFactory, {karmaConfig});
  console.log(`[karma-proxy] Upstream Proxy Server started at ` +
              `http://0.0.0.0:${upstreamProxyPort}/`);
})();
