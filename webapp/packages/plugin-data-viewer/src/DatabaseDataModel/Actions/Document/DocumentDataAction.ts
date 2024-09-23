/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { databaseDataAction } from '../DatabaseDataActionDecorator.js';
import { DatabaseDataResultAction } from '../DatabaseDataResultAction.js';
import type { IDatabaseDataDocument } from './IDatabaseDataDocument.js';
import type { IDocumentElementKey } from './IDocumentElementKey.js';

@databaseDataAction()
export class DocumentDataAction extends DatabaseDataResultAction<IDocumentElementKey, IDatabaseResultSet> {
  static override dataFormat = [ResultDataFormat.Document];

  get documents(): IDatabaseDataDocument[] {
    return this.result.data?.rowsWithMetaData?.map(row => row.data[0]) || [];
  }

  get count(): number {
    return this.result.data?.rowsWithMetaData?.length || 0;
  }

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>) {
    super(source);

    makeObservable(this, {
      documents: computed,
      count: computed,
    });
  }

  getMetadataForDocument(documentId: string) {
    const row = this.result.data?.rowsWithMetaData?.find(row => row.data[0]?.id === documentId);
    return row?.metaData;
  }

  getIdentifier(key: IDocumentElementKey): string {
    return key.index.toString();
  }

  serialize(key: IDocumentElementKey): string {
    return key.index.toString();
  }

  get(index: number): IDatabaseDataDocument | undefined {
    if (this.documents.length <= index) {
      return undefined;
    }

    return this.documents[index];
  }

  set(index: number, value: IDatabaseDataDocument): void {
    if (this.result.data?.rowsWithMetaData) {
      const row = this.result.data.rowsWithMetaData[index]!;

      if (row.data) {
        row.data[0] = value;
      }
    }
  }
}
