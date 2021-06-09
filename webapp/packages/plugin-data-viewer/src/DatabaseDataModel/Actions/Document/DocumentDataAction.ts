/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseDataResultAction } from '../IDatabaseDataResultAction';
import type { IDatabaseDataDocument } from './IDatabaseDataDocument';

@databaseDataAction()
export class DocumentDataAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataResultAction<IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Document;

  get count(): number {
    return this.result.data?.rows?.length || 0;
  }

  get(index: number): IDatabaseDataDocument | undefined {
    return this.result.data?.rows?.[index]?.[0];
  }
}
