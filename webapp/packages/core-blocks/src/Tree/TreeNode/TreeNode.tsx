/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { memo } from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { useObjectRef } from '../../useObjectRef';
import { ITreeNodeContext, TreeNodeContext } from './TreeNodeContext';
import { TREE_NODE_STYLES } from './TreeNodeStyles';

interface Props {
  loading?: boolean;
  selected?: boolean;
  expanded?: boolean;
  leaf?: boolean;
  className?: string;
  onExpand?: () => void;
  onSelect?: (multiple?: boolean, nested?: boolean) => void;
  onFilter?: (value: string) => void;
  filterValue?: string;
  onOpen?: () => void;
}

export const TreeNode: React.FC<Props> = memo(function TreeNode({
  loading = false,
  selected = false,
  filterValue = '',
  expanded = false,
  leaf = false,
  className,
  children,
  ...handlers
}) {
  const handlersRef = useObjectRef(handlers);

  const nodeContext = useObjectRef<ITreeNodeContext>({
    loading,
    selected,
    expanded,
    leaf,
    filterValue,
    expand() {
      handlersRef.onExpand?.();
    },
    select(multiple?: boolean, nested?: boolean): void {
      handlersRef.onSelect?.(multiple, nested);
    },
    filter(value: string): void {
      handlersRef.onFilter?.(value);
    },
    open() {
      handlersRef.onOpen?.();
    },
  }, {
    loading,
    selected,
    expanded,
    leaf,
    filterValue,
  }, {
    loading: observable.ref,
    selected: observable.ref,
    expanded: observable.ref,
    leaf: observable.ref,
    filterValue: observable.ref,
  });

  return styled(useStyles(TREE_NODE_STYLES))(
    <node {...use({ expanded })} className={className}>
      <TreeNodeContext.Provider value={nodeContext}>
        {children}
      </TreeNodeContext.Provider>
    </node>
  );
});
