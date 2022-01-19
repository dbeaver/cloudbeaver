/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseDataResultAction } from '../IDatabaseDataResultAction';
import type { IDatabaseDataDocument } from './IDatabaseDataDocument';

@databaseDataAction()
export class DocumentDataAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataResultAction<IDatabaseResultSet> {
  static dataFormat = [ResultDataFormat.Document];

  get documents(): IDatabaseDataDocument[] {
    return this.result.data?.rows?.map(row => row[0]) || [];
  }

  get count(): number {
    return this.result.data?.rows?.length || 0;
  }

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, result: IDatabaseResultSet) {
    super(source, result);

    makeObservable(this, {
      documents: computed,
      count: computed,
    });
  }

  get(index: number): IDatabaseDataDocument | undefined {
    if (this.documents.length <= index) {
      return undefined;
    }

    return this.documents[index];
  }

  set(index: number, value: IDatabaseDataDocument): void {
    if (this.result.data?.rows) {
      this.result.data.rows[index][0] = value;
    }
  }
}
