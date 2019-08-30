# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [2.0.0] - 2019-08-30
### Changed
- Format locale using hyphen instead of underscore (thx @benpptung)
- Drop express 3.x support
- Drop non-lts/latest node support (remove babel build)

### Added
- Warn about invalid configuration in non-production environment

## [1.2.0] - 2019-03-21
### Added
- Module usage (`module` entry in package.json)

## [1.1.0] - 2019-03-21
### Added
- Request property configuration option (thx @nachaos)

## [1.0.5] - 2017-11-05
### Fixed
- Tests on old node (0.1x)

## [1.0.4] - 2017-10-10
### Fixed
- Rollback dependency update for old node support

## [1.0.3] - 2017-10-10
### Added
- License file (thx @marionebl)

## [1.0.2] - 2017-07-02
### Fixed
- Babel runtime inclusion

## [1.0.1] - 2016-12-06
### Changed
- Readme code fix

## [1.0.0] - 2016-11-05
### Added
- Support for Express version 4
- Query string lookup

### Changed
- Renamed `domain` lookup to `hostname`
- Lookup configuration lives under the same keys as the priority list items
- Language to locale mapping became a lookup
- Custom lookups are supplied within the configuration
- Codebase now uses ES6 syntax

## [0.1.2] - 2014-06-28
### Fixed
- Changed en_UK into en_GB

## [0.1.1] - 2014-06-24
### Added
- First working version

[Unreleased]: https://github.com/smhg/express-locale/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/smhg/express-locale/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/smhg/express-locale/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/smhg/express-locale/compare/v1.0.5...v1.1.0
[1.0.5]: https://github.com/smhg/express-locale/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/smhg/express-locale/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/smhg/express-locale/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/smhg/express-locale/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/smhg/express-locale/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/smhg/express-locale/compare/v0.1.2...v1.0.0
[0.1.2]: https://github.com/smhg/express-locale/compare/v0.1.1...v0.1.2