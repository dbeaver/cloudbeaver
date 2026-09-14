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
import { useFocus } from '../../useFocus.js';
import { useHotkeys } from '../../useHotkeys.js';
import { EventKeyboardNavigationFlag } from '../../useListKeyboardNavigation.js';
import { useS } from '../../useS.js';
import { EventTreeNodeClickFlag } from './EventTreeNodeClickFlag.js';
import { EventTreeNodeExpandFlag } from './EventTreeNodeExpandFlag.js';
import { EventTreeNodeSelectFlag } from './EventTreeNodeSelectFlag.js';
import type { ITreeNodeState } from './ITreeNodeState.js';
import { TreeNodeContext } from './TreeNodeContext.js';
import style from './TreeNodeControl.module.css';
import { useMergeRefs } from '../../useMergeRefs.js';

const KEY = {
  ENTER: 'Enter',
};

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
    const [focusRef, focusState] = useFocus<HTMLDivElement>({});
    const hotkeysRef = useHotkeys<HTMLDivElement>('ArrowRight,ArrowLeft,Enter', handleKeyboardAction, { enabled: focusState.focus, useKey: true });
    const mergedRef = useMergeRefs(innerRef, focusRef, hotkeysRef, ref);

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

    async function handleKeyboardAction(event: KeyboardEvent) {
      if (
        event.target !== innerRef.current ||
        event.defaultPrevented ||
        EventContext.has(event, EventKeyboardNavigationFlag, EventStopPropagationFlag)
      ) {
        return;
      }

      const expand =
        !context.leaf &&
        !context.externalExpanded &&
        (event.key === 'Enter' || (event.key === 'ArrowRight' && !context.expanded) || (event.key === 'ArrowLeft' && context.expanded));
      const open = context.leaf && (event.key === 'Enter' || event.key === 'ArrowRight');

      if (!expand && !open) {
        return;
      }

      EventContext.set(event, EventKeyboardNavigationFlag);
      EventContext.set(event, EventTreeNodeExpandFlag);
      event.preventDefault();

      if (context.disabled || context.loading || context.processing) {
        return;
      }

      if (expand) {
        await context.expand();
      } else {
        await context.open();
      }
    }

    async function handleEnter(event: React.KeyboardEvent<HTMLDivElement>) {
      if (
        event.defaultPrevented ||
        event.target !== event.currentTarget ||
        EventContext.has(event, EventTreeNodeExpandFlag, EventTreeNodeSelectFlag, EventStopPropagationFlag)
      ) {
        return;
      }

      EventContext.set(event, EventTreeNodeSelectFlag);
      switch ((event as unknown as KeyboardEvent).code) {
        case KEY.ENTER:
          await context.select(event.ctrlKey || event.metaKey);
          break;
      }
      return true;
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
        tabIndex={context.selected ? 0 : -1}
        title={title}
        aria-selected={context.selected}
        className={s(styles, { treeNodeControl: true }, className)}
        data-tree-node-control
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onKeyDown={handleEnter}
        onDoubleClick={handleDbClick}
        {...rest}
      >
        {children}
      </div>
    );
  }),
);

TreeNodeControl.displayName = 'TreeNodeControl';
