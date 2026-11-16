/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { DatabaseDataResultAction } from '../DatabaseDataResultAction.js';
import type { IDatabaseDataDocument } from './IDatabaseDataDocument.js';
import type { IDocumentElementKey } from './IDocumentElementKey.js';

export class DocumentDataActionImpl<
  TKey extends IDocumentElementKey = IDocumentElementKey,
  TValue extends IDatabaseDataDocument = IDatabaseDataDocument,
  TResult extends IDatabaseResultSet = IDatabaseResultSet,
> extends DatabaseDataResultAction<TKey, TResult> {
  static override dataFormat = [ResultDataFormat.Document];

  get documents(): TValue[] {
    return this.result.data?.rowsWithMetaData?.map(row => row.data[0]) || [];
  }

  get count(): number {
    return this.result.data?.rowsWithMetaData?.length || 0;
  }

  constructor(source: IDatabaseDataSource, result: IDatabaseDataResult) {
    super(source as unknown as IDatabaseDataSource<unknown, TResult>, result as TResult);

    makeObservable(this, {
      documents: computed,
      count: computed,
    });
  }

  getMetadataForDocument(documentId: string) {
    const row = this.result.data?.rowsWithMetaData?.find(row => row.data[0]?.id === documentId);
    return row?.metaData;
  }

  getIdentifier(key: TKey): string {
    return key.index.toString();
  }

  serialize(key: TKey): string {
    return key.index.toString();
  }

  get(index: number): TValue | undefined {
    if (this.documents.length <= index) {
      return undefined;
    }

    return this.documents[index];
  }

  set(index: number, value: TValue): void {
    if (this.result.data?.rowsWithMetaData) {
      const row = this.result.data.rowsWithMetaData[index]!;

      if (row.data) {
        row.data[0] = value;
      }
    }
  }
}

export type DocumentDataAction<
  TKey extends IDocumentElementKey = IDocumentElementKey,
  TValue extends IDatabaseDataDocument = IDatabaseDataDocument,
  TResult extends IDatabaseResultSet = IDatabaseResultSet,
> = DocumentDataActionImpl<TKey, TValue, TResult>;

export class DocumentDataActionDI extends Context.Service<DocumentDataActionDI, DocumentDataActionImpl<any, any, any>>()(
  '@cloudbeaver/plugin-data-viewer/DatabaseDataModel/Actions/Document/DocumentDataAction#DocumentDataAction',
) {
  static readonly implementation = DocumentDataActionImpl;
  static readonly dataFormat = DocumentDataActionImpl.dataFormat;
  static readonly dependencies = () => [IDatabaseDataSource, IDatabaseDataResult] as const;
  static readonly make: Effect.Effect<
    DocumentDataActionImpl<any, any, any>,
    never,
    Context.Service.Identifier<typeof IDatabaseDataSource> | Context.Service.Identifier<typeof IDatabaseDataResult>
  > = Effect.gen(function* makeDocumentDataAction() {
    const source = yield* IDatabaseDataSource;
    const result = yield* IDatabaseDataResult;

    return new DocumentDataActionImpl(source, result);
  });
  static readonly layer: Layer.Layer<
    DocumentDataActionDI,
    never,
    Context.Service.Identifier<typeof IDatabaseDataSource> | Context.Service.Identifier<typeof IDatabaseDataResult>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DocumentDataAction = DocumentDataActionDI;
