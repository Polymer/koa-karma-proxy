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
import {Server} from 'http';

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
  karmaConfig?: karma.ConfigOptions|ConfigFile
};

export type Servers = {
  upstreamProxyServer: Server,
  upstreamProxyPort: number,
  karmaServer: karma.Server,
  karmaPort: number,
};

export const start =
    (upsFactory: UpstreamProxyServerFactory,
     options?: Options): Promise<Servers> => {
      let resolvePromisedServers: (servers: Servers) => void;
      let rejectPromisedServers: (err: Error) => void;
      const promisedServers: Promise<Servers> =
          new Promise((resolve, reject) => {
            resolvePromisedServers = resolve;
            rejectPromisedServers = reject;
          });
      const karmaConfig: ConfigOptions =
          options && options.karmaConfig as karma.ConfigOptions || {};
      const karmaConfigFile: ConfigFile = karmaConfig as ConfigFile;
      if (karmaConfigFile.configFile) {
        const {configFile} = karmaConfigFile;
        // delete karmaConfigFile.configFile;
        const configSetter = karma.config.parseConfig(configFile, karmaConfig);
        configSetter.set(karmaConfig);
      }
      // Karma's default upstreamProxy server port setting is 9875.  We'll start
      // looking for ports based on what's in the karma config for
      // upstreamProxy, but that's just a starting point.  `portfinder` will
      // settle on the first available one in ascending order, starting with
      // that one.
      const port =
          karmaConfig.upstreamProxy && karmaConfig.upstreamProxy.port || 9875;

      let upstreamProxyServer: Server;

      portfinder.getPort({port}, (err: Error, upstreamProxyPort: number) => {
        if (err) {
          rejectPromisedServers(err);
          return;
        }

        try {
          // Start with a placeholder middleware we can swap out once karma has
          // started and we know its port.
          let karmaProxyMiddleware =
              async (_ctx: unknown, _next: unknown) => {};

          // Get the upstreamProxyServer from the factory function, yielding a
          // wrapper that delegates to the karmaProxyMiddleware variable, then
          // start it up on the available port we found.
          upstreamProxyServer = upsFactory(
                                    (ctx: unknown, next: unknown) =>
                                        karmaProxyMiddleware(ctx, next))
                                    .listen(upstreamProxyPort);

          // Maybe this is overkill.  Just wanted to be a good citizen and close
          // the server explicitly so server doesn't hang on shutdown or keep
          // port reserved.
          process.on('SIGINT', () => upstreamProxyServer.close());

          if (!karmaConfig.upstreamProxy) {
            karmaConfig.upstreamProxy = {};
          }

          // This bit is important when starting the karma server because if it
          // is opening browsers, it needs to open them on the upstream port
          // instead of the default karma server port.
          karmaConfig.upstreamProxy.port = upstreamProxyPort;

          const karmaServer = new karma.Server(
              karmaConfig, (exitCode: number) => process.exit(exitCode));

          // When karma announces that it is listening, it has bound to a port
          // and we will replace the variable `karmaProxyMiddleware` with an
          // actual proxy middleware that points to the karma server.  Because
          // the closure of the function parameter given to the `upsFactory`
          // references this variable by name, it will begin calling into this
          // newly defined proxy middleware instead of the placeholder.
          karmaServer.on('listening', (karmaPort: number) => {
            const karmaHostname = karmaConfig.hostname || 'localhost';
            const karmaProtocol = karmaConfig.protocol || 'http:';
            karmaProxyMiddleware = proxy(
                {host: `${karmaProtocol}//${karmaHostname}:${karmaPort}/`});

            resolvePromisedServers({
              upstreamProxyPort,
              upstreamProxyServer,
              karmaPort,
              karmaServer
            });
          });

          karmaServer.start();
        } catch (err) {
          rejectPromisedServers(err);
          return;
        }
      });

      return promisedServers;
    };
