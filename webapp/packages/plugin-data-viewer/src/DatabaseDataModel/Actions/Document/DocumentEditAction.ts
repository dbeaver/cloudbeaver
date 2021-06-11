/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataEditorActionsData } from '../../IDatabaseDataEditor';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseDataEditAction } from '../IDatabaseDataEditAction';
import { DocumentDataAction } from './DocumentDataAction';
import type { IDatabaseDataDocument } from './IDatabaseDataDocument';
import type { IDocumentElementKey } from './IDocumentElementKey';

@databaseDataAction()
export class DocumentEditAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataEditAction<IDocumentElementKey, IDatabaseDataDocument, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Document;

  readonly editedElements: Map<number, IDatabaseDataDocument>;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, result: IDatabaseResultSet) {
    super(source, result);
    this.editedElements = new Map();
    this.resetEditedElements = this.resetEditedElements.bind(this);

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

  set(key: IDocumentElementKey, value: IDatabaseDataDocument): void {
    this.editedElements.set(key.index, value);

    // TODO: remove
    this.source
      .getEditor(this.resultIndex)
      .setCell(key.index, 0, value);

    this.removeUnchanged(key);
  }

  setData(key: IDocumentElementKey, value: string): void {
    const edited = this.editedElements.get(key.index);

    if (edited) {
      edited.data = value;
      this.set(key, edited);
      return;
    }

    const sourceValue = this.getAction(DocumentDataAction)
      .get(key.index);

    if (!sourceValue) {
      throw new Error('Source value not found');
    }

    this.set(key, {
      ...sourceValue,
      data: value,
    });
  }

  get(key: IDocumentElementKey): IDatabaseDataDocument | undefined {
    return this.editedElements.get(key.index);
  }

  revert(key: IDocumentElementKey): void {
    this.editedElements.delete(key.index);

    // TODO: remove
    this.source
      .getEditor(this.resultIndex)
      .revert(key.index);
  }

  clear(): void {
    this.editedElements.clear();
  }

  dispose(): void {
    // TODO: remove
    this.source.editor?.actions.removeHandler(this.resetEditedElements);
  }

  private resetEditedElements(action: IDatabaseDataEditorActionsData) {
    if (action.resultId === this.result.id && action.type === 'cancel') {
      this.editedElements.delete(action.row);
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
