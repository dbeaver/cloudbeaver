/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { PropsWithChildren } from 'react';

import { ContextMenu } from '@cloudbeaver/core-ui';

import type { ITreeMenu } from '../../useTreeMenu.js';
import { TreeMenuContext } from './TreeMenuContext.js';

interface Props {
  menu: ITreeMenu | null;
}

export const TreeMenuContextProvider = observer<PropsWithChildren<Props>>(function TreeMenuContextProvider({ menu, children }) {
  return (
    <TreeMenuContext value={menu}>
      {children}

      {menu && (
        <div className="tw:absolute tw:invisible">
          <ContextMenu menu={menu.menu} contextMenuPosition={menu.position} />
        </div>
      )}
    </TreeMenuContext>
  );
});
