# `trackAsReadOnlyDeep`

This function is behaviorally identical to [`track`](./track.md).  If called from typescript, the return type will have all properties marked `readonly`, meaning that no properties can be set.  This might be useful if your model is a class, and you want to ensure that state changes only happen within methods of the class.

