/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SqlResultColumn } from '@cloudbeaver/core-sdk';

export type TableColumn = Pick<
  SqlResultColumn,
  | 'dataKind'
  | 'entityName'
  | 'fullTypeName'
  | 'icon'
  | 'label'
  | 'maxLength'
  | 'name'
  | 'position'
  | 'precision'
  | 'readOnly'
  | 'scale'
  | 'typeName'
>
