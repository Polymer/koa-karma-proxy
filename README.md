# koa-karma-proxy

Simplified coordination of [karma](https://karma-runner.github.io/) and upstream proxy server using the [koa](https://koajs.com) web framework.

## Overview

This project came about because of the need to run a proxy server to perform on-demand transformations to responses from a karma server.  In principle this is straightforward as long as the karma and proxy server ports were reliably fixed.  When configuring karma, you have to be able to tell it what port the upstream proxy server is running on-- and you have to know what port the karma server is running on to direct requests from the proxy server.

The problem is that karma does not have a reliably fixed port, because karma will search for an available port when the default one is in use and then bind to that.  Because of the  mutual dependency on port knowledge between karma and the proxy server, some magic is required to slot in the karma server's address into the running proxy server after it starts up.

This library coordinates this process behind the scenes so your setup doesn't require a bunch of boilerplate with listeners and hooks to wire everything up.

## Usage

First, you'll need to install it, most likely as a `devDependency` of your `npm` package/application:

```sh
$ npm install --save-dev koa-karma-proxy
```

Create a file called `karma.proxy.js` and export a function that returns a Koa app, which will define your proxy server. Be sure to slot in the provided proxy to karma, which is the single given parameter, named "karma" in the example below:

```js
const Koa = require('koa');
const someMiddleaware = require('./some-middleware.js');
module.exports = (karma) => new Koa().use(someMiddleware).use(karma);
```

In the following example, we'll use the [`koa-node-resolve`](https://github.com/Polymer/koa-node-resolve) package to translate node bare module specifiers to relative paths on-the-fly. Please note that we mount the nodeResolve middleware specifically to the `/base` sub-path, since that is where karma serves our test, source and `node_modules` files from:

```js
const Koa = require('koa');
const mount = require('koa-mount');
const {nodeResolve} = require('koa-node-resolve');
module.exports = (karma) => new Koa()
    .use(mount('/base', nodeResolve())
    .use(karma);
```

Use the `karma-proxy` wrapper script exactly as you'd use `karma` executable:

```sh
$ npx karma-proxy start
```

This will:

1. find an open port for the proxy server.
2. start the proxy server, listening on that port.
3. start karma.  (identical to `karma start`)
4. wait for karma to confirm the port it is listening on.
5. configure the proxy middleware to start directing requests to karma.

The wrapper supports two optional flags in addition to all the ones in the standard `karma` CLI:

 - `--proxyFile` to point to a file other than `karma.proxy.js`.
 - `--proxyAddress` to specify a host name/IP for the proxy to listen on other than the default `0.0.0.0`.
 - `--proxyHostname` to specify a host name/IP to direct browsers to other than the default `localhost`.
 - `--proxyPort` to specify a starting port other than the default `9876` to start the upstream proxy server on.

Please note, when using `npx`, flags given to `karma-proxy` should follow a `--` separator so they are not treated as `npx` flags:
```sh
$ npx karma-proxy start -- --proxyFile ./lib/my-proxy.js --proxyPort 30330
```

## Advanced Usage

You don't have to use `karma-proxy` as an executable from the command-line.  It exposes everything you need to leverage within your own code:

```ts
const Koa = require('koa');
const mount = require('koa-mount');
const {join} = require('path');
const {start} = require('koa-karma-proxy');
const {nodeResolve} = require('koa-node-resolve');

(async () => {
  const {upstreamProxyPort, karmaPort} =
    await start((karma) => new Koa()
      .use(mount('/base', nodeResolve())
      .use(karma), {
        // Karma config options
        configFile: join(__dirname, '../karma.conf.js'),
        singleRun: true
      });
  console.log(`Upstream Port ${upstreamProxyPort}`);
  console.log(`Karma Port ${karmaPort}`);
})();
```
