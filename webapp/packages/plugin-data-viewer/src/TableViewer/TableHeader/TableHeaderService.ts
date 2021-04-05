/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import { TableWhereFilter } from './TableWhereFilter';

export interface ITableHeaderPlaceholderProps {
  model: IDatabaseDataModel<any, any>;
  resultIndex: number;
}

@injectable()
export class TableHeaderService extends Bootstrap {
  readonly tableHeaderPlaceholder = new PlaceholderContainer<ITableHeaderPlaceholderProps>();

  register(): void {
    this.tableHeaderPlaceholder.add(TableWhereFilter, 1);
  }

  load(): void | Promise<void> { }
}
