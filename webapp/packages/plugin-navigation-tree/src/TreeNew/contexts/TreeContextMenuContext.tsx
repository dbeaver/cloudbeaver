/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext, use, useRef, useState, type PropsWithChildren } from 'react';

import type { IMenuData } from '@cloudbeaver/core-view';
import { useContextMenuPosition } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { ContextMenu } from '@cloudbeaver/core-ui';

interface ITreeContextMenuContext {
  openMenu: (event: React.MouseEvent<HTMLDivElement>, nodeId: string, setContext?: (context: IDataContext, id: string) => void) => void;
}

const TreeContextMenuContext = createContext<ITreeContextMenuContext | null>(null);

export function useTreeContextMenu(): ITreeContextMenuContext {
  const context = use(TreeContextMenuContext);

  if (!context) {
    throw new Error('useTreeContextMenu must be used within a TreeContextMenuProvider');
  }

  return context;
}

interface Props {
  menu: IMenuData;
}

export function TreeContextMenuProvider(props: PropsWithChildren<Props>) {
  const { menu } = props;
  const nodeIdRef = useRef<string | null>(null);

  const [visible, setVisible] = useState(false);
  const position = useContextMenuPosition();

  function openMenu(event: React.MouseEvent<HTMLDivElement>, nodeId: string, setContext?: (context: IDataContext, id: string) => void) {
    if (setContext) {
      setContext(menu.context, nodeId);
    }

    position.handleContextMenuOpen(event);
    nodeIdRef.current = nodeId;
  }

  function handleVisibleChange(value: boolean) {
    if (visible !== value) {
      setVisible(value);

      if (!value && nodeIdRef.current) {
        menu.context.deleteForId(nodeIdRef.current);
        nodeIdRef.current = null;
      }
    }
  }

  return (
    <TreeContextMenuContext.Provider value={{ openMenu }}>
      {props.children}
      <div className="tw:absolute tw:invisible">
        <ContextMenu menu={menu} contextMenuPosition={position} visible={visible} modal onVisibleSwitch={handleVisibleChange} />
      </div>
    </TreeContextMenuContext.Provider>
  );
}
