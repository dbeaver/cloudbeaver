/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataEditorActionsData } from '../../IDatabaseDataEditor';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseDataEditAction, IDatabaseDataEditActionData } from '../IDatabaseDataEditAction';
import { DocumentDataAction } from './DocumentDataAction';
import type { IDatabaseDataDocument } from './IDatabaseDataDocument';
import type { IDocumentElementKey } from './IDocumentElementKey';

@databaseDataAction()
export class DocumentEditAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataEditAction<IDocumentElementKey, IDatabaseDataDocument, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Document;

  readonly action: IExecutor<IDatabaseDataEditActionData<IDocumentElementKey, IDatabaseDataDocument>>;
  readonly editedElements: Map<number, IDatabaseDataDocument>;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, result: IDatabaseResultSet) {
    super(source, result);
    this.editedElements = new Map();
    this.resetEditedElements = this.resetEditedElements.bind(this);
    this.action = new Executor();

    makeObservable(this, {
      editedElements: observable,
    });

    // TODO: remove
    this.source.editor?.actions.addHandler(this.resetEditedElements);
  }

  isEdited(): boolean {
    return this.editedElements.size > 0;
  }

  isElementEdited(key: IDocumentElementKey): boolean {
    if (!this.editedElements.has(key.index)) {
      return false;
    }

    const value = this.getAction(DocumentDataAction).get(key.index);

    return !this.compare(value, this.get(key));
  }

  set(key: IDocumentElementKey, value: IDatabaseDataDocument, prevValue?: IDatabaseDataDocument): void {
    if (!prevValue) {
      prevValue = this.get(key);

      if (!prevValue) {
        prevValue = this.getAction(DocumentDataAction)
          .get(key.index);
      }
    }

    this.editedElements.set(key.index, value);

    this.action.execute({
      type: 'edit',
      resultId: this.result.id,
      value: {
        key: key,
        prevValue,
        value,
      },
    });

    // TODO: remove
    this.source
      .getEditor(this.resultIndex)
      .setCell(key.index, 0, value);

    this.removeUnchanged(key);
  }

  setData(key: IDocumentElementKey, value: string): void {
    let previousValue = this.get(key);

    if (!previousValue) {
      previousValue = this.getAction(DocumentDataAction)
        .get(key.index);
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

  get(key: IDocumentElementKey): IDatabaseDataDocument | undefined {
    return this.editedElements.get(key.index);
  }

  revert(key: IDocumentElementKey): void {
    this.editedElements.delete(key.index);

    this.action.execute({
      type: 'revert',
      resultId: this.result.id,
      value: { key: key },
    });

    // TODO: remove
    this.source
      .getEditor(this.resultIndex)
      .revert(key.index);
  }

  clear(): void {
    this.editedElements.clear();
    this.action.execute({
      type: 'revert',
      resultId: this.result.id,
    });
  }

  dispose(): void {
    this.clear();
    // TODO: remove
    this.source.editor?.actions.removeHandler(this.resetEditedElements);
  }

  private resetEditedElements(action: IDatabaseDataEditorActionsData) {
    if (action.resultId === this.result.id && action.type === 'cancel') {
      this.revert({ index: action.row });
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
