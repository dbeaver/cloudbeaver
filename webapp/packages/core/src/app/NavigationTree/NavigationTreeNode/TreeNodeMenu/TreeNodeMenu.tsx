/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react';
import { useMemo } from 'react';
import styled, { use } from 'reshadow';

import { Icon } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { MenuTrigger } from '@dbeaver/core/dialogs';

import { useNode } from '../../../shared/NodesManager/useNode';
import { NavigationTreeContextMenuService } from '../../NavigationTreeContextMenuService';
import { treeNodeMenuStyles } from './treeNodeMenuStyles';


type TreeNodeMenuProps = {
  nodeId: string;
  isSelected: boolean;
}

export const TreeNodeMenu = observer(function TreeNodeMenu({
  nodeId,
  isSelected,
}: TreeNodeMenuProps) {

  const navigationTreeContextMenuService = useService(NavigationTreeContextMenuService);
  const node = useNode(nodeId)!;

  const menuPanel = useMemo(
    () => navigationTreeContextMenuService.constructMenuWithContext(node),
    [nodeId]
  );
  const isHidden = useMemo(
    () => computed(() => !menuPanel.menuItems.length
      || menuPanel.menuItems.every(item => item.isHidden)),
    [nodeId]
  );

  if (isHidden.get()) {
    return null;
  }

  return styled(treeNodeMenuStyles)(
    <MenuTrigger panel={menuPanel} {...use({ isSelected })}>
      <Icon name="snack" viewBox="0 0 16 10" />
    </MenuTrigger>
  );
});
