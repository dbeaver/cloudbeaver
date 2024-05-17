/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
type UnionUndefinedToNull<T> = T extends undefined ? null : T;

export type UndefinedToNull<T extends object> = {
  [Prop in keyof T]-?: T[Prop] extends object ? UndefinedToNull<T[Prop]> : UnionUndefinedToNull<T[Prop]>;
};
