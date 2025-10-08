/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { ResultDataFormat, type SqlResultRow, type AsyncUpdateResultsDataBatchMutationVariables } from '@cloudbeaver/core-sdk';

import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { DatabaseEditAction } from '../DatabaseEditAction.js';
import { DatabaseEditChangeType, type IDatabaseDataEditApplyActionData } from '../IDatabaseDataEditAction.js';
import { DocumentDataAction } from './DocumentDataAction.js';
import type { IDatabaseDataDocument } from './IDatabaseDataDocument.js';
import type { IDocumentElementKey } from './IDocumentElementKey.js';
import { injectable } from '@cloudbeaver/core-di';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult, DocumentDataAction])
export class DocumentEditAction<
  TKey extends IDocumentElementKey = IDocumentElementKey,
  TValue extends IDatabaseDataDocument = IDatabaseDataDocument,
  TResult extends IDatabaseResultSet = IDatabaseResultSet,
> extends DatabaseEditAction<TKey, TValue, IDatabaseDataEditApplyActionData, TResult> {
  static override dataFormat = [ResultDataFormat.Document];

  readonly editedElements: Map<number, TValue>;
  private readonly data: DocumentDataAction<TKey, TValue, TResult>;

  constructor(source: IDatabaseDataSource, result: IDatabaseDataResult, data: DocumentDataAction<TKey, TValue, TResult>) {
    super(source as unknown as IDatabaseDataSource<unknown, TResult>, result as TResult);
    this.editedElements = new Map();
    this.data = data;

    makeObservable(this, {
      editedElements: observable,
    });
  }

  isEdited(): boolean {
    return this.editedElements.size > 0;
  }

  isElementEdited(key: TKey): boolean {
    if (!this.editedElements.has(key.index)) {
      return false;
    }

    const value = this.data.get(key.index);

    return !this.compare(value, this.get(key));
  }

  getElementState(key: TKey): DatabaseEditChangeType | null {
    if (this.isElementEdited(key)) {
      return DatabaseEditChangeType.update;
    }

    return null;
  }

  get(key: TKey): TValue | undefined {
    return this.editedElements.get(key.index);
  }

  set(key: TKey, value: TValue, prevValue?: TValue): void {
    if (!prevValue) {
      prevValue = this.get(key);

      if (!prevValue) {
        prevValue = this.data.get(key.index);
      }
    }

    this.editedElements.set(key.index, value);

    this.action.execute({
      type: DatabaseEditChangeType.update,
      revert: false,
      resultId: this.result.id,
      value: [
        {
          key: key,
          prevValue,
          value,
        },
      ],
    });

    this.removeUnchanged(key);
  }

  add(key: TKey): void {
    throw new Error('Not implemented');
  }

  duplicate(key: TKey): void {
    throw new Error('Not implemented');
  }

  delete(key: TKey): void {
    throw new Error('Not implemented');
  }

  setData(key: TKey, value: string): void {
    let previousValue = this.get(key);

    if (!previousValue) {
      previousValue = this.data.get(key.index);
    }

    if (!previousValue) {
      throw new Error('Source value not found');
    }

    this.set(
      key,
      {
        ...previousValue,
        data: value,
      },
      previousValue,
    );
  }

  applyPartialUpdate(resultId: string | null, rows: TValue[][]): void {
    let rowIndex = 0;

    for (const [id] of this.editedElements) {
      const document = rows[rowIndex]?.[0];

      if (document !== undefined) {
        this.data.set(id, document);
      }
      rowIndex++;
    }
  }

  applyUpdate(resultId: string | null, rows: TValue[][]): void {
    let rowIndex = 0;

    for (const [id] of this.editedElements) {
      const document = rows[rowIndex]?.[0];

      if (document !== undefined) {
        this.data.set(id, document);
      }
      rowIndex++;
    }
    this.clear();
  }

  revert(key: TKey): void {
    this.editedElements.delete(key.index);

    this.action.execute({
      revert: true,
      resultId: this.result.id,
      value: [{ key: key }],
    });
  }

  clear(): void {
    this.editedElements.clear();
    this.action.execute({
      revert: true,
      resultId: this.result.id,
    });
  }

  override dispose(): void {
    this.clear();
  }

  fillBatch(batch: AsyncUpdateResultsDataBatchMutationVariables): void {
    for (const [id, document] of this.editedElements) {
      if (batch.updatedRows === undefined) {
        batch.updatedRows = [];
      }
      const updatedRows = batch.updatedRows as SqlResultRow[];

      updatedRows.push({
        data: [this.data.get(id)],
        metaData: this.data.getMetadataForDocument(document.id),
        updateValues: {
          // TODO: remove, place new document in data field
          0: document,
        },
      });
    }
  }

  private removeUnchanged(key: TKey) {
    if (!this.isElementEdited(key)) {
      this.revert(key);
    }
  }

  private compare(documentA: TValue | undefined, documentB: TValue | undefined) {
    return documentA?.data === documentB?.data;
  }
}
