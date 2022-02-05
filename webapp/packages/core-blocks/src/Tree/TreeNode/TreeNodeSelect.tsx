/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled, { css } from 'reshadow';

import { EventContext } from '@cloudbeaver/core-events';

import { Checkbox } from '../../FormControls/Checkboxes/Checkbox';
import { Loader } from '../../Loader/Loader';
import { EventTreeNodeSelectFlag } from './EventTreeNodeSelectFlag';
import { TreeNodeContext } from './TreeNodeContext';

const styles = css`
  Loader {
    width: 40px;
    height: 40px;
  }
`;

interface Props {
  group?: boolean;
  onSelect?: () => Promise<boolean | void> | boolean | void;
  selected?: boolean;
  disabled?: boolean;
  loadIndicator?: boolean;
  className?: string;
}

export const TreeNodeSelect = observer<Props>(function TreeNodeSelect({
  onSelect,
  group,
  selected,
  disabled,
  loadIndicator,
  className,
}) {
  const context = useContext(TreeNodeContext);

  if (!context) {
    throw new Error('Context not provided');
  }

  if (context.disabled) {
    disabled = context.disabled;
  }

  if (group === undefined) {
    group = context.group;
  }

  async function handleSelect() {
    await onSelect?.();

    await context!.select(true, group);
  }

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    EventContext.set(event, EventTreeNodeSelectFlag);
  };

  const handleDbClick = (event: React.MouseEvent<HTMLDivElement>) => {
    EventContext.set(event, EventTreeNodeSelectFlag);
  };

  return styled(styles)(
    <div className={className} onClick={handleClick} onDoubleClick={handleDbClick}>
      {loadIndicator && context.loading
        ? <Loader small />
        : (
          <Checkbox
            checked={selected ?? context.selected}
            disabled={disabled}
            onChange={handleSelect}
          />
        )}
    </div>
  );
});
