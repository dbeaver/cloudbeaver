/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { CoreSettingsService } from '../CoreSettingsService';
import type { NavNode } from '../shared/NodesManager/EntityTypes';
import { useChildren } from '../shared/useChildren';
import { NavigationNodeElement } from './NavigationTreeNode/NavigationNodeElement';
import { ITreeContext, TreeContext } from './TreeContext';

const styles = css`
  tree {
    position: relative;
    box-sizing: border-box;
  }

  center {
    display: flex;
    height: 100%;
    width: 100%;
    min-width: 240px;
  }
`;

interface Props {
  root?: string;
  control?: React.FC<{
    node: NavNode;
  }>;
  emptyPlaceholder: React.FC;
  className?: string;
  onOpen?: (node: NavNode) => Promise<void> | void;
  onSelect?: (node: NavNode, multiple: boolean) => boolean;
  isSelected?: (node: NavNode) => boolean;
}

export const ElementsTree: React.FC<Props> = observer(function ElementsTree({
  root,
  control,
  emptyPlaceholder,
  className,
  onOpen,
  onSelect,
  isSelected,
}) {
  const config = useService(CoreSettingsService);
  const nodeChildren = useChildren(root);
  const Placeholder = emptyPlaceholder;
  const limit = useMemo(() => computed(() => config.settings.getValue('app.navigationTree.childrenLimit')), [config]);

  const context = useMemo<ITreeContext>(
    () => ({ control, onOpen, onSelect, isSelected }),
    [control, onOpen, onSelect, isSelected]
  );

  if (!nodeChildren.children || nodeChildren.children.length === 0) {
    if (nodeChildren.isLoading()) {
      return styled(styles)(
        <center as="div">
          <Loader />
        </center>
      );
    }

    return <Placeholder />;
  }

  return styled(styles)(
    <TreeContext.Provider value={context}>
      <tree as="div" className={className}>
        {nodeChildren.children.slice(0, limit.get()).map(id => (
          <NavigationNodeElement key={id} nodeId={id} />
        ))}
        <Loader loading={nodeChildren.isLoading()} overlay />
      </tree>
    </TreeContext.Provider>
  );
});
