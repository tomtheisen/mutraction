# `PropReference`

`PropReference` objects refer to a particular property on a particular object.  They are similar to property descriptors, although implemented differently.  They can be used to set and get the value of the property.  They comply with React's `ref` contract.

## Properties

### `object`

This is the target object that contains the property.

### `prop`

This is the name of the target property.  It's generally a string.  But it could also be a symbol.

### `current`

This gets or sets the value of the referenced property.