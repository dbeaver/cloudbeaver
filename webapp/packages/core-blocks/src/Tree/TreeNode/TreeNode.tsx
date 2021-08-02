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
  onExpand?: () => Promise<void> | void;
  onSelect?: (multiple?: boolean, nested?: boolean) => Promise<void> | void;
  onFilter?: (value: string) => Promise<void> | void;
  filterValue?: string;
  onOpen?: () => Promise<void> | void;
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

  async function processAction(action: () => Promise<void>) {
    nodeContext.processing = true;

    try {
      await action();
    } finally {
      nodeContext.processing = false;
    }
  }

  const nodeContext = useObjectRef<ITreeNodeContext>({
    processing: false,
    loading,
    selected,
    expanded,
    leaf,
    filterValue,
    async expand() {
      await processAction(async () => {
        await handlersRef.onExpand?.();
      });
    },
    async select(multiple?: boolean, nested?: boolean) {
      await processAction(async () => {
        await handlersRef.onSelect?.(multiple, nested);
      });
    },
    async filter(value: string) {
      await processAction(async () => {
        await handlersRef.onFilter?.(value);
      });
    },
    async open() {
      await processAction(async () => {
        await handlersRef.onOpen?.();
      });
    },
  }, {
    loading,
    selected,
    expanded,
    leaf,
    filterValue,
  }, {
    processing: observable.ref,
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
