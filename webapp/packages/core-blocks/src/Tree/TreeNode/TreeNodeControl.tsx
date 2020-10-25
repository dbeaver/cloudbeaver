/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';

import { TreeNodeContext } from './TreeNodeContext';

const KEY = {
  ENTER: 'Enter',
};

interface Props {
  className?: string;
  big?: boolean;
}

export const TreeNodeControl: React.FC<Props> = function TreeNodeControl({
  className,
  children,
}) {
  const context = useContext(TreeNodeContext);

  if (!context) {
    throw new Error('Context not provided');
  }

  const handleEnter = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    switch ((event as unknown as KeyboardEvent).code) {
      case KEY.ENTER:
        context?.select(event.ctrlKey || event.metaKey);
        break;
    }
    return true;
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    context?.select(event.ctrlKey || event.metaKey);
  };

  return (
    <div
      tabIndex={0}
      aria-selected={context.selected}
      className={className}
      onClick={handleClick}
      onKeyDown={handleEnter}
      onDoubleClick={context.open}
    >
      {children}
    </div>
  );
};
