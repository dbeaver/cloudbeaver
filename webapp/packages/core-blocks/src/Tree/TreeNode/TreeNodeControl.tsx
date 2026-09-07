/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useContext, useRef } from 'react';

import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';

import { s } from '../../s.js';
import { useS } from '../../useS.js';
import { EventTreeNodeClickFlag } from './EventTreeNodeClickFlag.js';
import { EventTreeNodeExpandFlag } from './EventTreeNodeExpandFlag.js';
import { EventTreeNodeSelectFlag } from './EventTreeNodeSelectFlag.js';
import type { ITreeNodeState } from './ITreeNodeState.js';
import { TreeNodeContext } from './TreeNodeContext.js';
import style from './TreeNodeControl.module.css';
import { useMergeRefs } from '../../useMergeRefs.js';

interface Props extends ITreeNodeState {
  title?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  children?: React.ReactNode;
}

export const TreeNodeControl = observer<Props & React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>(
  forwardRef(function TreeNodeControl(
    { title, group, disabled, loading, selected, expanded, externalExpanded, leaf, onClick, onMouseDown, className, children, ...rest },
    ref,
  ) {
    const styles = useS(style);
    const context = useContext(TreeNodeContext);
    const innerRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMergeRefs(innerRef, ref);

    if (!context) {
      throw new Error('Context not provided');
    }

    if (group !== undefined) {
      context.group = group;
    }

    if (disabled !== undefined) {
      context.disabled = disabled;
    }

    if (loading !== undefined) {
      context.loading = loading;
    }

    if (selected !== undefined) {
      context.selected = selected;
    }

    if (expanded !== undefined) {
      context.expanded = expanded;
    }

    if (leaf !== undefined) {
      context.leaf = leaf;
    }

    if (externalExpanded !== undefined) {
      context.externalExpanded = externalExpanded;
    }

    async function handleClick(event: React.MouseEvent<HTMLDivElement>) {
      if (onClick) {
        onClick(event);
      }

      if (EventContext.has(event, EventTreeNodeExpandFlag, EventTreeNodeSelectFlag, EventStopPropagationFlag)) {
        return;
      }

      EventContext.set(event, EventTreeNodeClickFlag);

      await context.click?.();
    }
    async function handleDbClick(event: React.MouseEvent<HTMLDivElement>) {
      if (EventContext.has(event, EventTreeNodeExpandFlag, EventTreeNodeSelectFlag, EventStopPropagationFlag)) {
        return;
      }
      await context.open();
    }
    function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
      if (onMouseDown) {
        onMouseDown(event);
      }
    }

    return (
      <div
        ref={mergedRef}
        title={title}
        data-selected={context.selected}
        className={s(styles, { treeNodeControl: true }, className)}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDbClick}
        {...rest}
        data-tree-node-content
      >
        {children}
      </div>
    );
  }),
);

TreeNodeControl.displayName = 'TreeNodeControl';
