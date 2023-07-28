# Options

The options object can be used to configure the behavior of mutraction.

## Properties

### `trackHistory`: boolean? 

Enables or disables history tracking.  If history tracking is disabled, transactions and history management will not be available, but memory usage will be lower.  The default value for `trackHistory` is `true`.

### `autoTransactionalize`: boolean?

Enable or disable the automatic creation of transactions when model methods are called.  When you call a method on a tracked object, this option will make a transaction surrounding every method call.  Transactions created this way will be automatically committed.  If the method throws, they'll be rolled back instead.

`autoTransactionalize` requires `trackHistory`.