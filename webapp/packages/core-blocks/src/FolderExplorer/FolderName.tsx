/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { Icon } from '../Icon.js';
import { Link } from '../Link.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { FolderExplorerContext } from './FolderExplorerContext.js';
import style from './FolderName.module.css';

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

export const FolderName = observer<FolderProps | ShortProps>(function FolderName({ folder, path, title, short, last, getName }) {
  const styles = useS(style);
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

  return (
    <div className={s(styles, { pathElement: true })} title={title || name}>
      <div className={s(styles, { pathElementArrow: true })}>
        <Icon name="arrow" viewBox="0 0 16 16" />
      </div>
      <div className={s(styles, { pathElementName: true })}>{last ? name : <Link onClick={() => context.open(path, folder!)}>{name}</Link>}</div>
    </div>
  );
});
