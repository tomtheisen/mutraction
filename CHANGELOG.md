# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Expose some DOM node cleanup functions under the exported object `cleanup`.  There's almost never a use for these directly.  But I'm saying there's a chance.

### Changed

- The `ignoreUpdates()` instance method on `Tracker` now returns the result of its callback argument.
- A warning is logged to the console if a new object is tracked during the callback to `Swapper()`.  This is probably unintentional, and can cause dependencies that  make the swapper reload more often than intended.

## [0.25.1] - 2023-12-29

### Added

- `neverTrack()` is now available to prevent proxies on arbitrary objects

### Fixed

- Fixed a regression in 0.25.0 where `mu:if` / `mu:else` chains would prematurely dispose their dependency registration.  This caused the contained DOM nodes to stop getting updates from tracked model changes.

## [0.25.0] - 2023-12-28

### Added 

- `class` is usable instead of `className`.  Use of both is not recommended.

### Removed

- The undocumented `timestamp` property was removed from history entries.

### Changed

- `Map`s and `Set`s can now be `track()`ed.  Depending on the use case, performance might not be great.  Any change to the collection will cause all element dependencies of the data structure to be notified.  Performance may improve in the future.
- Some performance optimizations have been applied.
    - When an `effect()` callback doesn't return a cleanup function, an empty placeholder function is not scheduled to run in its place.
    - DOM node cleanups no longer run synchronously.  They now run "later" via [`requestIdleCallback()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)
    - There is a faster approach for emptying an `ElementSpan`, which is an internal type representing a contiguous span nodes.  It's similar to a [`DocumentFragment`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment), but it's allowed to be attached to the document as well.  Internally, this is used by pretty much everything in mutraction.
    - There is a faster implementation of the special case where a `ForEach` array becomes empty after being non-empty.
    - When not running in debug mode, there is no longer a collection maintained of all `PropRef`s maintained.

## [0.24.0] - 2023-11-25

### Changed

- `Set` and `Map` objects can now tracked.

## [0.23.1] - 2023-11-21

### Changed

- The active effect list in the diagnostic tool now groups effect callbacks by function name.

## [0.23.0] - 2023-11-20

### Added

- Execute `window[Symbol.for('mutraction.debug')]()` on the console to access diagnostic tools.

### Fixed

- When a `mu:if` conditional element is a descendant of a cleaned-up document element, all its subscriptions are invalidated and disposed.
- When a `mu:if` never satisfies its condition, and its container is cleaned up, the condition subscription is now cleaned up correctly instead of leaking an active effect.

### Removed

- The experimental `mu:diagnostic` JSX attribute.

## [0.22.4] - 2023-11-11

### Fixed

- When a `ForEach()` is a descendant of a cleaned-up document element, (possibly because it was a child of a conditional `mu:if element`) all its subscriptions are invalidated and disposed.  This eliminates some orphaned property trackers.

## [0.22.3] - 2023-11-11

### Fixed

- When history tracking is turned off in a `Tracker` instance via `setOptions()`, the internal operation history array is removed to conserve memory.  Previously this behavior was ony available via the `Tracker` constructor.
## [0.22.2] - 2023-11-09

### Fixed

- Elements removed from `ForEach` output due to reducing the `length` property on the array now have their respective subscriptions disposed.

## [0.22.1] - 2023-11-08

### Fixed

- Elements were not being correctly removed from `ForEach()` when directly reducing `length` on the passed array.

## [0.22.0] - 2023-10-06

### Added

- `mu:diagnostic` attribute for debugging/instrumentation.  It's not documented yet, as it's still somewhat experimental and subject to change.

## [0.21.5] - 2023-09-30

### Changed

- When a dependency of a `mu:if` condition changes without changing the result of the condition itself, the attached node is no longer re-built.
- When a tracker is configured with `trackHistory` false, automatically turn off `compactOnCommit`, which would have no effect except burning CPU cycles
- When part of a tracked object graph, non-extensible objects will not be proxied, rather than throwing.  This means replacement of the object will be tracked, but not internal mutations.

## [0.21.4] - 2023-09-23

### Changed

- Starting a transaction no longer requires history tracking to be turned on.

### Added

- Trackers have a new `ignoreUpdates` method that runs a callback without notifying subscribers

## [0.21.3] - 2023-09-21

### Fixed

- When a tracking proxy would attempt to wrap another object in a tracking proxy, first check if there's an existing proxy that could be used instead.  This will allow reference equality testing to work between the resulting proxies.
- Detached swappers no longer get unnecessary tracker updates.

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
