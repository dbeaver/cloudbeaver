/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { use } from 'reshadow';

import { getComputed } from '../../getComputed';
import { useObjectRef } from '../../useObjectRef';
import { useObservableRef } from '../../useObservableRef';
import type { ITreeNodeState } from './ITreeNodeState';
import { ITreeNodeContext, TreeNodeContext } from './TreeNodeContext';
import { TREE_NODE_STYLES } from './TreeNodeStyles';

interface Props extends ITreeNodeState {
  className?: string;
  children?: React.ReactNode;
  onClick?: (leaf: boolean) => Promise<void> | void;
  onExpand?: () => Promise<void> | void;
  onSelect?: (multiple?: boolean, nested?: boolean) => Promise<void> | void;
  onOpen?: (leaf: boolean) => Promise<void> | void;
}

interface IInnerTreeNodeContext extends ITreeNodeContext {
  inProgress: number;
}

export const TreeNode = observer<Props, HTMLDivElement | null>(function TreeNode({
  group = false,
  loading = false,
  selected = false,
  indeterminateSelected = false,
  disabled = false,
  expanded = false,
  showInFilter = false,
  externalExpanded,
  leaf = false,
  className,
  children,
  ...handlers
}, ref) {
  const handlersRef = useObjectRef(handlers);

  async function processAction(action: () => Promise<void>) {
    nodeContext.inProgress++;

    try {
      await action();
    } finally {
      nodeContext.inProgress--;
    }
  }

  const nodeContext = useObservableRef<IInnerTreeNodeContext>(() => ({
    get processing() {
      return this.inProgress > 0;
    },
    inProgress: 0,
    async click() {
      await processAction(async () => {
        await handlersRef.onClick?.(this.leaf);
      });
    },
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
    async open() {
      await processAction(async () => {
        await handlersRef.onOpen?.(this.leaf);
      });
    },
  }), {
    group: observable.ref,
    disabled: observable.ref,
    processing: computed,
    inProgress: observable.ref,
    loading: observable.ref,
    selected: observable.ref,
    indeterminateSelected: observable.ref,
    expanded: observable.ref,
    externalExpanded: observable.ref,
    showInFilter: observable.ref,
    leaf: observable.ref,
  }, {
    group,
    disabled,
    loading,
    selected,
    indeterminateSelected,
    expanded,
    showInFilter,
    externalExpanded: externalExpanded || false,
    leaf,
  });

  const elementExpanded = getComputed(() => nodeContext.expanded || nodeContext.externalExpanded);

  return styled(TREE_NODE_STYLES)(
    <node {...use({ expanded: elementExpanded })} ref={ref} className={className}>
      <TreeNodeContext.Provider value={nodeContext}>
        {children}
      </TreeNodeContext.Provider>
    </node>
  );
}, { forwardRef: true });
