/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useMemo, useRef } from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { ITreeNodeContext, TreeNodeContext } from './TreeNodeContext';
import { TREE_NODE_STYLES } from './TreeNodeStyles';

interface Props {
  loading?: boolean;
  selected?: boolean;
  expanded?: boolean;
  leaf?: boolean;
  className?: string;
  onExpand?: () => void;
  onSelect?: (multiple?: boolean) => boolean;
  onOpen?: () => void;
}

export const TreeNode: React.FC<Props> = observer(function TreeNode({
  loading = false,
  selected = false,
  expanded = false,
  leaf = false,
  className,
  children,
  ...handlers
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const handleExpand = () => {
    handlersRef.current.onExpand?.();
  };

  const handleSelect = (multiple?: boolean): boolean => handlersRef.current.onSelect?.(multiple) || false;

  const handleOpen = () => {
    handlersRef.current.onOpen?.();
  };

  const nodeContext = useMemo<ITreeNodeContext>(() => ({
    loading,
    selected,
    expanded,
    leaf,
    expand: handleExpand,
    select: handleSelect,
    open: handleOpen,
  }), [loading, selected, expanded, leaf, handleExpand, handleSelect, handleOpen]);

  return styled(useStyles(TREE_NODE_STYLES))(
    <node as="div" {...use({ expanded })} className={className}>
      <TreeNodeContext.Provider value={nodeContext}>
        {children}
      </TreeNodeContext.Provider>
    </node>
  );
});
