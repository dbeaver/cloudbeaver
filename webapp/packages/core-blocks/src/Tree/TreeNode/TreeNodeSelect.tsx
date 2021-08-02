/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { EventContext } from '@cloudbeaver/core-events';

import { Checkbox } from '../../FormControls/Checkboxes/Checkbox';
import { EventTreeNodeSelectFlag } from './EventTreeNodeSelectFlag';
import { TreeNodeContext } from './TreeNodeContext';

interface Props {
  group?: boolean;
  onSelect?: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
}

export const TreeNodeSelect: React.FC<Props> = observer(function TreeNodeSelect({
  onSelect,
  group,
  selected,
  disabled,
  className,
}) {
  const context = useContext(TreeNodeContext);

  if (!context) {
    throw new Error('Context not provided');
  }

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    EventContext.set(event, EventTreeNodeSelectFlag);
  };

  const handleDbClick = (event: React.MouseEvent<HTMLDivElement>) => {
    EventContext.set(event, EventTreeNodeSelectFlag);
  };

  return (
    <div className={className} onClick={handleClick} onDoubleClick={handleDbClick}>
      <Checkbox
        checked={selected ?? context.selected}
        disabled={disabled}
        onChange={onSelect ?? (() => context.select(true, group))}
      />
    </div>
  );
});
