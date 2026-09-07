/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import { EventContext } from '@cloudbeaver/core-events';

import { s } from '../../s.js';
import { useObjectRef } from '../../useObjectRef.js';
import { useObservableRef } from '../../useObservableRef.js';
import { useS } from '../../useS.js';
import { EventTreeNodeSelectFlag } from './EventTreeNodeSelectFlag.js';
import type { ITreeNodeState } from './ITreeNodeState.js';
import componentStyle from './TreeNode.module.css';
import { type ITreeNodeContext, TreeNodeContext } from './TreeNodeContext.js';

interface Props extends ITreeNodeState {
  nodeId?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: (leaf: boolean) => Promise<void> | void;
  onExpand?: () => Promise<void> | void;
  onSelect?: (multiple?: boolean, nested?: boolean) => Promise<void> | void;
  onOpen?: (leaf: boolean) => Promise<void> | void;
}

interface IInnerTreeNodeContext extends ITreeNodeContext {
  inProgress: number;
}

export const TreeNode = observer<Props, HTMLDivElement | null>(
  forwardRef(function TreeNode(
    {
      group = false,
      nodeId,
      loading = false,
      selected = false,
      indeterminateSelected = false,
      disabled = false,
      expanded = false,
      showInFilter = false,
      externalExpanded,
      leaf = false,
      className,
      style,
      children,
      ...handlers
    },
    ref,
  ) {
    const styles = useS(componentStyle);
    const handlersRef = useObjectRef(handlers);

    const nodeContext = useObservableRef<IInnerTreeNodeContext>(
      () => ({
        get processing() {
          return this.inProgress > 0;
        },
        inProgress: 0,
        async processAction(action: () => Promise<void>) {
          this.inProgress++;

          try {
            await action();
          } finally {
            this.inProgress--;
          }
        },
        async click() {
          await this.processAction(async () => {
            await handlersRef.onClick?.(this.leaf);
          });
        },
        async expand() {
          await this.processAction(async () => {
            await handlersRef.onExpand?.();
          });
        },
        async select(multiple?: boolean, nested?: boolean) {
          await this.processAction(async () => {
            await handlersRef.onSelect?.(multiple, nested);
          });
        },
        async open() {
          await this.processAction(async () => {
            await handlersRef.onOpen?.(this.leaf);
          });
        },
      }),
      {
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
        processAction: action.bound,
      },
      {
        group,
        disabled,
        loading,
        selected,
        indeterminateSelected,
        expanded,
        showInFilter,
        externalExpanded,
        leaf,
      },
    );
    let tabIndex: number | undefined;

    if (nodeId) {
      tabIndex = selected ? 0 : -1;
    }

    async function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      if (event.target !== event.currentTarget || EventContext.has(event, EventTreeNodeSelectFlag)) {
        return;
      }

      if (event.code === 'Enter') {
        EventContext.set(event, EventTreeNodeSelectFlag);
        await nodeContext.select(event.ctrlKey || event.metaKey);
      }
    }

    return (
      <div
        ref={ref}
        role={nodeId ? 'treeitem' : undefined}
        aria-selected={nodeId ? selected : undefined}
        aria-expanded={nodeId && !leaf ? Boolean(expanded || externalExpanded) : undefined}
        tabIndex={tabIndex}
        className={s(styles, { node: true }, className)}
        style={style}
        data-tree-node-id={nodeId}
        data-tree-node-control={nodeId ? true : undefined}
        onKeyDown={handleKeyDown}
      >
        <TreeNodeContext.Provider value={nodeContext}>{children}</TreeNodeContext.Provider>
      </div>
    );
  }),
);

TreeNode.displayName = 'TreeNode';
