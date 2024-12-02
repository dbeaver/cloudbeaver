/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useTranslate } from '@cloudbeaver/core-blocks';
import { type DynamicTraceProperty } from '@cloudbeaver/core-sdk';
import type { RenderHeaderCellProps } from '@cloudbeaver/plugin-data-grid';

export const HeaderCell = observer<RenderHeaderCellProps<DynamicTraceProperty>>(function HeaderCell(props) {
  const translate = useTranslate();

  return <div>{typeof props.column.name === 'string' ? translate(props.column.name) : props.column.name}</div>;
});
