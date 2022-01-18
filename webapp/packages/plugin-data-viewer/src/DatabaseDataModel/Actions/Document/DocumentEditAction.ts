/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { ResultDataFormat, SqlResultRow, UpdateResultsDataBatchMutationVariables } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import { DatabaseEditAction } from '../DatabaseEditAction';
import { DatabaseEditChangeType } from '../IDatabaseDataEditAction';
import { DocumentDataAction } from './DocumentDataAction';
import type { IDatabaseDataDocument } from './IDatabaseDataDocument';
import type { IDocumentElementKey } from './IDocumentElementKey';

@databaseDataAction()
export class DocumentEditAction
  extends DatabaseEditAction<IDocumentElementKey, IDatabaseDataDocument, IDatabaseResultSet> {
  static dataFormat = [ResultDataFormat.Document];

  readonly editedElements: Map<number, IDatabaseDataDocument>;
  private data: DocumentDataAction;

  constructor(
    source: IDatabaseDataSource<any, IDatabaseResultSet>,
    result: IDatabaseResultSet,
    data: DocumentDataAction
  ) {
    super(source, result);
    this.editedElements = new Map();
    this.data = data;

    makeObservable(this, {
      editedElements: observable,
    });
  }

  isEdited(): boolean {
    return this.editedElements.size > 0;
  }

  isElementEdited(key: IDocumentElementKey): boolean {
    if (!this.editedElements.has(key.index)) {
      return false;
    }

    const value = this.data.get(key.index);

    return !this.compare(value, this.get(key));
  }

  getElementState(key: IDocumentElementKey): DatabaseEditChangeType | null {
    if (this.isElementEdited(key)) {
      return DatabaseEditChangeType.update;
    }

    return null;
  }

  get(key: IDocumentElementKey): IDatabaseDataDocument | undefined {
    return this.editedElements.get(key.index);
  }

  set(key: IDocumentElementKey, value: IDatabaseDataDocument, prevValue?: IDatabaseDataDocument): void {
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
      value: [{
        key: key,
        prevValue,
        value,
      }],
    });

    this.removeUnchanged(key);
  }

  add(key: IDocumentElementKey): void {
    throw new Error('Not implemented');
  }

  duplicate(key: IDocumentElementKey): void {
    throw new Error('Not implemented');
  }

  delete(key: IDocumentElementKey): void {
    throw new Error('Not implemented');
  }

  setData(key: IDocumentElementKey, value: string): void {
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
      previousValue
    );
  }

  applyUpdate(result: IDatabaseResultSet): void {
    let rowIndex = 0;

    for (const [id, document] of this.editedElements) {
      const value = result.data?.rows?.[rowIndex];

      if (value !== undefined) {
        this.data.set(id, value[0]);
      }
      rowIndex++;
    }
    this.clear();
  }

  revert(key: IDocumentElementKey): void {
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

  dispose(): void {
    this.clear();
  }

  fillBatch(batch: UpdateResultsDataBatchMutationVariables): void {
    for (const [id, document] of this.editedElements) {
      if (batch.updatedRows === undefined) {
        batch.updatedRows = [];
      }
      const updatedRows = batch.updatedRows as SqlResultRow[];

      updatedRows.push({
        data: [this.data.get(id)],
        updateValues: { // TODO: remove, place new document in data field
          0: document,
        },
      });
    }
  }

  private removeUnchanged(key: IDocumentElementKey) {
    if (!this.isElementEdited(key)) {
      this.revert(key);
    }
  }

  private compare(documentA: IDatabaseDataDocument | undefined, documentB: IDatabaseDataDocument | undefined) {
    return documentA?.data === documentB?.data;
  }
}
