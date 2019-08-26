# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->

## Unreleased 

 - Added a `--proxyHost` CLI flag
 - Added an `upstreamProxyHost` option in `start()`

<!-- Add new unreleased items here -->

## [1.0.0-pre.4] - 2019-08-08

 - Make it possible to specify upstream proxy port through more common vectors:
   - Add a `--proxyPort` CLI flag
   - Add an `upstreamProxyPort` option in `start()`
 - Default the upstream proxy port to 9876.

## [1.0.0-pre.3] - 2019-08-06

 - Fixed the karma-proxy CLI; was missing shebang directive.

## [1.0.0-pre.2] - 2019-08-06

 - Initial release.
