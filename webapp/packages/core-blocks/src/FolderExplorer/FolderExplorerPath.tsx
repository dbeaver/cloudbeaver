/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { s } from '../s.js';
import { useS } from '../useS.js';
import { FolderExplorerContext } from './FolderExplorerContext.js';
import style from './FolderExplorerPath.module.css';
import { FolderName } from './FolderName.js';

interface Props {
  getName?: (folder: string) => string;
  canSkip?: (folder: string) => boolean;
  className?: string;
}

export const FolderExplorerPath = observer<Props>(function FolderExplorerPath({ getName, canSkip, className }) {
  const styles = useS(style);
  const context = useContext(FolderExplorerContext);

  if (!context) {
    throw new Error('Folder explorer context should be provided');
  }

  if (context.state.fullPath.length <= 1) {
    return null;
  }

  const pathElements: React.JSX.Element[] = [];
  let skip = false;
  let skipTitle = '';

  for (let i = 0; i < context.state.fullPath.length; i++) {
    const folder = context.state.fullPath[i]!;
    const path = context.state.fullPath.slice(0, i);
    const skipFolder = !canSkip || canSkip(folder);

    if (i === 0 || i === context.state.fullPath.length - 1 || !skipFolder || context.state.fullPath.length < 5) {
      if (skip) {
        pathElements.push(<FolderName key={i - 1} path={path} title={skipTitle} short />);
      }

      pathElements.push(<FolderName key={i} folder={folder} path={path} last={i === context.state.fullPath.length - 1} getName={getName} />);
      skip = false;
      skipTitle = '';
      continue;
    }

    if (canSkip) {
      if (skipTitle !== '') {
        skipTitle += ' > ';
      }
      skipTitle += getName?.(folder) || folder;
      skip = true;
      continue;
    }
  }

  return <div className={s(styles, { folderExplorerPath: true }, className)}>{pathElements}</div>;
});
