# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed

- `ErrorBoundary` - turns out it wasn't that good

## [0.19.1] - 2023-09-05

### Changed

- `effect` callbacks won't be notified until all open transactions are closed.

## [0.19.0] - 2023-09-04

### Added

- `makeLocalStyle`
- `mu:apply`

## [0.18.0] - 2023-09-02

### Added

- `ErrorBoundary`
- `Swapper`

### Changed

- Added cleanup callback option to `ForEach`
