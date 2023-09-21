# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.21.2] - 2023-09-20

### Changed

- Some removed document nodes no longer stay synchronized to tracked model changes.  In particular, nodes that automatically become inactive based on `ForEach`, `Swapper`, `Router`, and `mu:if` no longer receive updates.

## [0.21.1] - 2023-09-17

### Changed

- `ForEach` and `ForEachPersist` can now take a null or undefined array without throwing.
- JSX compilation new retains whitespace following an element, but preceding a newline.
- Added `boolean` the the typescript input type for `untrackedClone()`.

## [0.21.0] - 2023-09-15

### Added

- `untrackedClone()`

### Changed

- Reduced the call stack depth for most of the jsx rendering operations
- Support truthy/falsy in `classList` values in addition to strict booleans

## [0.20.3] - 2023-09-14

### Fixed

- Fixed a bug that caused `Swapper` to take more dependencies than it should, leading to extraneous element replacements

## [0.20.2] - 2023-09-14

### Changed

- Added timestamps to all change history elements
- `ForEach` and `ForEachPersist` can now take functions returning arrays instead of arrays.  In that case, reference changes to the identity of the array itself will be followed.

## [0.20.1] - 2023-09-11

### Fixed

- The callback function to `Tracker.getPropRef` no longer registers any dependencies for active `DependencyTrackers`.  This behavior could cause extraneous subscriber callbacks.

### Changed

- When returning a value from the `effect` callback, it will no longer be invoked unless it is a function.  This means that you can sometimes use expression-based lambdas instead of block definitions.

## [0.20.0] - 2023-09-08

### Removed

- `ErrorBoundary` - turns out it wasn't that good, and you can accomplish most of what you'd care about with `catch`

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
