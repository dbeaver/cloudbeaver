/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';

import { DataModelWrapper } from '../DataModelWrapper';
import { TableWhereFilter } from './TableWhereFilter';

@injectable()
export class TableHeaderService extends Bootstrap {
  readonly tableHeaderPlaceholder = new PlaceholderContainer<DataModelWrapper>()

  register() {
    this.tableHeaderPlaceholder.add(TableWhereFilter, 1);
  }
  load(): void | Promise<void> { }
}
