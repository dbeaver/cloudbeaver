/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { TableItem, TableColumnValue, TableItemExpand } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';
import type { IVersion } from '@cloudbeaver/core-version';

import { VersionInfo } from './VersionInfo';

const styles = css`
  TableColumnValue[expand] {
    cursor: pointer;
  }
  TableColumnValue[|gap] {
    gap: 16px;
  }
`;

interface Props {
  version: IVersion;
}

export const Version = observer<Props>(function Version({ version }) {
  return styled(useStyles(styles))(
    <TableItem item={version.number} expandElement={VersionInfo}>
      <TableColumnValue centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue expand>{version.number}</TableColumnValue>
      <TableColumnValue>{version.date}</TableColumnValue>
    </TableItem>
  );
});
