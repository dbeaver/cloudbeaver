/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import type { IndexedDB } from './IndexedDB.js';

export class IndexedDBServiceImpl {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register(db: IndexedDB): void {
    // TODO: implement
  }
}

export type IndexedDBService = IndexedDBServiceImpl;

export class IndexedDBServiceDI extends Context.Service<IndexedDBServiceDI, IndexedDBServiceImpl>()(
  '@cloudbeaver/core-browser/IndexedDB/IndexedDBService#IndexedDBService',
) {
  static readonly implementation = IndexedDBServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<IndexedDBServiceImpl, never, never> = Effect.sync(() => new IndexedDBServiceImpl());
  static readonly layer: Layer.Layer<IndexedDBServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const IndexedDBService = IndexedDBServiceDI;
