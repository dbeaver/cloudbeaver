/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled from 'reshadow';

import { Icon } from '../Icon';
import { Link } from '../Link';
import { FolderExplorerContext } from './FolderExplorerContext';
import { folderExplorerStyles } from './folderExplorerStyles';

interface Props {
  folder: string;
  last?: boolean;
  getName?: (folder: string) => string;
}

export const FolderName = observer<Props>(function FolderName({
  folder,
  last,
  getName,
}) {
  const context = useContext(FolderExplorerContext);

  if (!context) {
    throw new Error('Folder explorer context should be provided');
  }

  const name = getName?.(folder) || folder;

  return styled(folderExplorerStyles)(
    <folder-explorer-path-element>
      <folder-explorer-path-element-arrow>
        <Icon name="arrow" viewBox="0 0 16 16" />
      </folder-explorer-path-element-arrow>
      {last
        ? name
        : <Link onClick={() => context.open(folder)}>{name}</Link>}
    </folder-explorer-path-element>
  );
});
