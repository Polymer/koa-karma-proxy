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
 * Some quick terminology, because this can get confusing:
 *
 *  - `upstreamProxyServer` refers to the proxy server that the user of this
 *     package defines.
 *  - `karmaProxyMiddleware` is a Koa middleware which proxies requests to
 *     an instance of a karma server that is running.
 */

import karma = require('karma');
import Koa from 'koa';
import portfinder = require('portfinder');
const proxy = require('koa-proxy');
import {createServer, Server} from 'http';

/**
 * A function that takes a Koa middleware to proxy requests to karma
 * server and returns a Koa application that uses the middleware.
 */
export type UpstreamProxyServerFactory =
    (karmaProxyMiddleware: Koa.Middleware) => Koa;

/**
 * Have to extend the types here because karma TypeScript types do not declare
 * the `upstreamProxy` object.
 */
interface ConfigOptions extends karma.ConfigOptions {
  upstreamProxy?: {
    path?: string,
    port?: number,
    hostname?: string,
    protocol?: string,
  };
}

interface ConfigFile {
  configFile: string;
}

export type Options = {
  karmaConfig?: karma.ConfigOptions|ConfigFile,
  karmaExitCallback?: (exitCode: number) => void,
  upstreamProxyHost?: string,
  upstreamProxyPort?: number,
};

export type Servers = {
  upstreamProxyServer: Server,
  upstreamProxyPort: number,
  karmaServer: karma.Server,
  karmaPort: number,
};

/**
 * Starts up an upstream proxy server and a karma server such that their startup
 * and shutdowns are coordinated and they know about each other's ports.
 *
 * @param upstreamProxyServerFactory a factory function that takes a Koa
 *     middleware to proxy requests to karma and returns the upstream proxy
 *     server.
 * @param options contains karmaConfig and karmaExitCallback options.
 */
export const start = async(
    upstreamProxyServerFactory: UpstreamProxyServerFactory,
    options?: Options): Promise<Servers> => new Promise((resolve, reject) => {
  const karmaConfig: ConfigOptions =
      options && options.karmaConfig as karma.ConfigOptions || {};
  const karmaConfigFile: ConfigFile = karmaConfig as ConfigFile;
  const startingUpstreamProxyPort: number =
      options && options.upstreamProxyPort || 9876;
  const upstreamProxyHost: string =
      options && options.upstreamProxyHost || 'localhost';
  if (karmaConfigFile.configFile) {
    const {configFile} = karmaConfigFile;
    const configSetter = karma.config.parseConfig(configFile, karmaConfig);
    configSetter.set(karmaConfig);
  }

  const karmaExitCallback: ((exitCode: number) => void)|undefined =
      options && options.karmaExitCallback;

  // Record the port that we used the last time we try to bind to it, so we
  // don't try that one on subsequent attempts.
  let lastUpstreamProxyPortTried: number;

  // There are a couple of places where we may run into errors that are related
  // to a chosen upstream port becoming unavailable when we try to bind to it.
  // Whenever the error is related to the port, we'll retry starting the server.
  // Otherwise, we'll reject the promise with the error encountered.
  const retryOrReject = (port: number, err: Error) => {
    const {code} = err as Error & {code: string};
    if (code === 'EADDRINUSE' || code === 'EACCES') {
      return startUpstreamProxyServer(port + 1);
    } else {
      return reject(err);
    }
  };

  // Start with a placeholder middleware we can swap out once
  // karma has started and we know its port.
  let karmaProxyMiddleware = async (_ctx: unknown, _next: unknown) => {};

  // Get the upstreamProxyServer from the factory function,
  // yielding a wrapper that delegates to the karmaProxyMiddleware variable.
  const upstreamProxyServer =
      createServer(upstreamProxyServerFactory(
                       async (ctx: unknown, next: unknown) =>
                           await karmaProxyMiddleware(ctx, next))
                       .callback());
  upstreamProxyServer.on(
      'error', (err: Error) => retryOrReject(lastUpstreamProxyPortTried, err));
  upstreamProxyServer.on('listening', () => {
    startKarmaServer(lastUpstreamProxyPortTried);
  });

  const startUpstreamProxyServer = (startingPort: number) => {
    portfinder.getPort(
        {port: startingPort}, (err: Error, upstreamProxyPort: number) => {
          if (err) {
            return retryOrReject(startingPort, err);
          }
          try {
            lastUpstreamProxyPortTried = upstreamProxyPort;
            upstreamProxyServer.listen(upstreamProxyPort, upstreamProxyHost);
          } catch (err) {
            return retryOrReject(upstreamProxyPort, err);
          }
        });
  };

  const startKarmaServer = (upstreamProxyPort: number) => {
    if (!karmaConfig.upstreamProxy) {
      karmaConfig.upstreamProxy = {};
    }

    // This bit is important when starting the karma server
    // because if it is opening browsers, it needs to open them
    // on the upstream port instead of the default karma server
    // port.
    karmaConfig.upstreamProxy.port = upstreamProxyPort;

    const karmaServer = new karma.Server(karmaConfig, karmaExitCallback);

    // When karma announces that it is listening, it has bound
    // to a port and we will replace the variable
    // `karmaProxyMiddleware` with an actual proxy middleware
    // that points to the karma server.  Because the closure of
    // the function parameter for the`upstreamProxyServerFactory`
    // references this variable by name, it will begin calling
    // into this newly defined proxy middleware instead of the
    // placeholder.
    karmaServer.on('listening', (karmaPort: number) => {
      const karmaHostname = karmaConfig.hostname || 'localhost';
      const karmaProtocol = karmaConfig.protocol || 'http:';
      karmaProxyMiddleware =
          proxy({host: `${karmaProtocol}//${karmaHostname}:${karmaPort}/`});
      resolve({upstreamProxyPort, upstreamProxyServer, karmaPort, karmaServer});
    });

    karmaServer.start();
    karmaServer.on('close', () => upstreamProxyServer.close());
  };

  startUpstreamProxyServer(startingUpstreamProxyPort);
});
