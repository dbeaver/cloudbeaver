/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import DexieConstructor, { type Dexie, type DexieConstructor as DexieConstructorType, type Table as IndexedDBTable } from 'dexie';

export const IndexedDB = DexieConstructor as unknown as DexieConstructorType;
export type IndexedDB = Dexie;
export { type IndexedDBTable };
