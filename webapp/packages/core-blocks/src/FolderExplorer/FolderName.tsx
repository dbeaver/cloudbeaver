/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
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

interface BaseProps {
  folder?: string;
  path: string[];
  title?: string;
  short?: boolean;
  last?: boolean;
  getName?: (folder: string, path: string[]) => string;
}

interface FolderProps extends BaseProps {
  folder: string;
  path: string[];
  title?: string;
  last?: boolean;
  getName?: (folder: string, path: string[]) => string;
}

interface ShortProps extends BaseProps {
  short: boolean;
}

export const FolderName = observer<FolderProps | ShortProps>(function FolderName({
  folder,
  path,
  title,
  short,
  last,
  getName,
}) {
  const context = useContext(FolderExplorerContext);

  if (!context) {
    throw new Error('Folder explorer context should be provided');
  }

  let name = 'Folder';

  if (short) {
    name = '...';
  }

  if (folder !== undefined) {
    name = getName?.(folder, path) || folder;
  }

  if (folder === undefined) {
    folder = path[path.length - 1];
    path = path.slice(0, path.length - 1);
  }

  return styled(folderExplorerStyles)(
    <folder-explorer-path-element title={title || name}>
      <folder-explorer-path-element-arrow>
        <Icon name="arrow" viewBox="0 0 16 16" />
      </folder-explorer-path-element-arrow>
      <folder-explorer-path-element-name>
        {last
          ? name
          : <Link onClick={() => context.open(path, folder!)}>{name}</Link>}
      </folder-explorer-path-element-name>
    </folder-explorer-path-element>
  );
});
