# koa-karma-proxy

Simplified coordination of [karma]([https://karma-runner.github.io](https://karma-runner.github.io/) and upstream proxy server using the [koa](https://koajs.com) web framework.

## Overview

This project came about because of the need to run a proxy server to perform on-demand transformations to responses from a karma server.  In principle this is straightforward as long as the karma and proxy server ports were reliably fixed.  When configuring karma, you have to be able to tell it what port the upstream proxy server is running on-- and you have to know what port the karma server is running on to direct requests from the proxy server.

The problem is that karma does not have a reliably fixed port, because karma will search for an available port when the default one is in use and then bind to that.  Because of the  mutual dependency on port knowledge between karma and the proxy server, some magic is required to slot in the karma server's address into the running proxy server after it starts up.

This library coordinates this process behind the scenes so your setup doesn't require a bunch of boilerplate with listeners and hooks to wire everything up.

## Usage

First, you'll need to install it, most likely as a `devDependency` of your `npm` package/application:

```sh
$ npm install --save-dev koa-karma-proxy
```

Create a file called `karma.proxy.js` and export a function that returns a Koa app, which will define your proxy server.  Be sure to slot in the provided proxy to karma, which is the single given parameter, named `"karma"` in the example below:

```js
const Koa = require('koa');
const myMiddleware = require('./my-middleware.js');
module.exports = (karma) => new Koa().use(myMiddleware).use(karma);
```

Use the `koa-karma-proxy` wrapper exactly as you'd use `karma` executable:

```sh
$ npx koa-karma-proxy start
```

This will:

1. find an open port for the proxy server.
2. start the proxy server, listening on that port.
3. start karma.  (identical to `karma start`)
4. wait for karma to confirm the port it is listening on.
5. configure the proxy middleware to start directing requests to karma.
