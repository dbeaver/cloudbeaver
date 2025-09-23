/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type EmptyObject = Record<any, never>;

export const EMPTY_ARRAY: ReadonlyArray<any> = Object.freeze([]);
export const EMPTY_OBJECT: Readonly<EmptyObject> = Object.freeze({});
