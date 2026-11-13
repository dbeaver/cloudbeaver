/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseDataMetadataAction } from '../IDatabaseDataMetadataAction.js';

export class DatabaseMetadataActionImpl<TKey, TResult extends IDatabaseDataResult>
  extends DatabaseDataAction<any, TResult>
  implements IDatabaseDataMetadataAction<TKey, TResult>
{
  static dataFormat: ResultDataFormat[] | null = null;
  readonly metadata: MetadataMap<string, any>;

  constructor(source: IDatabaseDataSource<any, TResult>, result: TResult) {
    super(source, result);
    this.metadata = new MetadataMap();
  }

  has(key: string): boolean {
    return this.metadata.has(key);
  }

  get<T>(key: string): T | undefined;
  get<T>(key: string, getDefaultValue: (() => T) | undefined): T;
  get<T>(key: string, getDefaultValue?: (() => T) | undefined): T | undefined {
    return this.metadata.get(key, getDefaultValue);
  }

  set(key: string, value: any): void {
    this.metadata.set(key, value);
  }

  delete(key: string): void {
    this.metadata.delete(key);
  }
}

export type DatabaseMetadataAction<TKey, TResult extends IDatabaseDataResult> = DatabaseMetadataActionImpl<TKey, TResult>;

export class DatabaseMetadataActionDI extends Context.Service<DatabaseMetadataActionDI, DatabaseMetadataActionImpl<any, any>>()(
  '@cloudbeaver/plugin-data-viewer/DatabaseDataModel/Actions/General/DatabaseMetadataAction#DatabaseMetadataAction',
) {
  static readonly implementation = DatabaseMetadataActionImpl;
  static readonly dataFormat = DatabaseMetadataActionImpl.dataFormat;
  static readonly dependencies = () => [IDatabaseDataSource, IDatabaseDataResult] as const;
  static readonly make: Effect.Effect<
    DatabaseMetadataActionImpl<any, any>,
    never,
    Context.Service.Identifier<typeof IDatabaseDataSource> | Context.Service.Identifier<typeof IDatabaseDataResult>
  > = Effect.gen(function* makeDatabaseMetadataAction() {
    const source = yield* IDatabaseDataSource;
    const result = yield* IDatabaseDataResult;

    return new DatabaseMetadataActionImpl(source, result);
  });
  static readonly layer: Layer.Layer<
    DatabaseMetadataActionDI,
    never,
    Context.Service.Identifier<typeof IDatabaseDataSource> | Context.Service.Identifier<typeof IDatabaseDataResult>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DatabaseMetadataAction = DatabaseMetadataActionDI;
