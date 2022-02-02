/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';

import { EventTreeNodeExpandFlag } from './EventTreeNodeExpandFlag';
import { EventTreeNodeSelectFlag } from './EventTreeNodeSelectFlag';
import type { ITreeNodeState } from './ITreeNodeState';
import { TreeNodeContext } from './TreeNodeContext';

const KEY = {
  ENTER: 'Enter',
};

interface Props extends ITreeNodeState {
  title?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  big?: boolean;
}

export const TreeNodeControl = observer<Props>(function TreeNodeControl({
  title,
  group,
  disabled,
  loading,
  selected,
  expanded,
  externalExpanded,
  leaf,
  onClick,
  className,
  children,
}) {
  const context = useContext(TreeNodeContext);

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

  const handleEnter = async (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (EventContext.has(event, EventTreeNodeExpandFlag, EventTreeNodeSelectFlag, EventStopPropagationFlag)) {
      return;
    }

    EventContext.set(event, EventTreeNodeSelectFlag);
    switch ((event as unknown as KeyboardEvent).code) {
      case KEY.ENTER:
        await context.select(event.ctrlKey || event.metaKey);
        break;
    }
    return true;
  };

  const handleClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(event);
    }

    if (EventContext.has(event, EventTreeNodeExpandFlag, EventTreeNodeSelectFlag, EventStopPropagationFlag)) {
      return;
    }

    await context.click?.();
  };

  const handleDbClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (EventContext.has(event, EventTreeNodeExpandFlag, EventTreeNodeSelectFlag, EventStopPropagationFlag)) {
      return;
    }
    await context.open();
  };

  return (
    <div
      tabIndex={0}
      title={title}
      aria-selected={context.selected}
      className={className}
      onClick={handleClick}
      onKeyDown={handleEnter}
      onDoubleClick={handleDbClick}
    >
      {children}
    </div>
  );
});
