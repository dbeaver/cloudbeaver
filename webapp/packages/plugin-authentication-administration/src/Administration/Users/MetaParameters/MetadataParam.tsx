/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand
} from '@cloudbeaver/core-blocks';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
  TableColumnValue[expand] {
    cursor: pointer;
  }
`;

interface Props {
  param: ObjectPropertyInfo;
  selectable?: boolean;
}

export const MetadataParam = observer<Props>(function MetadataParam({ param, selectable }) {
  return styled(useStyles(styles))(
    <TableItem item={param.id} selectDisabled={!selectable}>
      {selectable && (
        <TableColumnValue centerContent flex>
          <TableItemSelect />
        </TableColumnValue>
      )}
      <TableColumnValue centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue expand>{param.id}</TableColumnValue>
      <TableColumnValue>{param.description}</TableColumnValue>
      <TableColumnValue>{}</TableColumnValue>
    </TableItem>
  );
});
