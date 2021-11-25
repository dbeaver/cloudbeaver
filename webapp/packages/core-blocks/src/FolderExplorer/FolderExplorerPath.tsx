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

import { FolderExplorerContext } from './FolderExplorerContext';
import { folderExplorerStyles } from './folderExplorerStyles';
import { FolderName } from './FolderName';

interface Props {
  getName?: (folder: string) => string;
  className?: string;
}

export const FolderExplorerPath = observer<Props>(function FolderExplorerPath({
  getName,
  className,
}) {
  const context = useContext(FolderExplorerContext);

  if (!context) {
    throw new Error('Folder explorer context should be provided');
  }

  if (context.path.length === 0) {
    return null;
  }

  return styled(folderExplorerStyles)(
    <folder-explorer-path className={className}>
      <FolderName folder={context.root} getName={getName} />
      {context.path.map((folder, i) => (
        <FolderName
          key={folder}
          folder={folder}
          last={i === context.path.length - 1}
          getName={getName}
        />
      ))}
    </folder-explorer-path>
  );
});
