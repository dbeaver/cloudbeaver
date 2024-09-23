/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, TableColumnValue, TableItem, TableItemExpand, useS } from '@cloudbeaver/core-blocks';
import type { IVersion } from '@cloudbeaver/core-version';

import styles from './Version.module.css';
import { VersionInfo } from './VersionInfo.js';

interface Props {
  version: IVersion;
}

export const Version = observer<Props>(function Version({ version }) {
  const style = useS(styles);
  return (
    <TableItem item={version.number} expandElement={VersionInfo}>
      <TableColumnValue className={s(style, { tableColumnValueExpand: true })} centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue className={s(style, { tableColumnValueExpand: true })} expand>
        {version.number}
      </TableColumnValue>
      <TableColumnValue>{version.date}</TableColumnValue>
    </TableItem>
  );
});
