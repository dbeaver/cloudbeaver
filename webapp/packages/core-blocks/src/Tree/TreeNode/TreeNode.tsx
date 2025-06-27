/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import { s } from '../../s.js';
import { useObjectRef } from '../../useObjectRef.js';
import { useObservableRef } from '../../useObservableRef.js';
import { useS } from '../../useS.js';
import type { ITreeNodeState } from './ITreeNodeState.js';
import style from './TreeNode.module.css';
import { type ITreeNodeContext, TreeNodeContext } from './TreeNodeContext.js';

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

export const TreeNode = observer<Props, HTMLDivElement | null>(
  forwardRef(function TreeNode(
    {
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
    },
    ref,
  ) {
    const styles = useS(style);
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

    return (
      <div ref={ref} className={s(styles, { node: true }, className)}>
        <TreeNodeContext.Provider value={nodeContext}>{children}</TreeNodeContext.Provider>
      </div>
    );
  }),
);

TreeNode.displayName = 'TreeNode';
