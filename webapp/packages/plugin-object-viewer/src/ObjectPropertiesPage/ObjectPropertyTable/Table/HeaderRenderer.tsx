/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import type { HeaderRendererProps } from 'react-data-grid';

import type { DBObject } from '@cloudbeaver/core-app';

import { TableContext } from './TableContext';

export const HeaderRenderer = observer<HeaderRendererProps<DBObject>>(function HeaderRenderer(props) {
  const tableContext = useContext(TableContext);
  const dataColumn = tableContext.tableData?.columns.find(column => column.key === props.column.key);

  return (
    <div title={dataColumn?.description}>
      {props.column.name}
    </div>
  );
});