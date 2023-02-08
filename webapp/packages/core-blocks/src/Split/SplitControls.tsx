/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use } from 'reshadow';

import { useObjectRef } from '../useObjectRef';
import { buttonStyles } from './splitButtonStyles';
import { useSplit } from './useSplit';

export const SplitControls: React.FC = function SplitControls() {
  const split = useSplit();

  const inverse = split.state.isMainSecond();

  let inverseMode = split.state.mode;

  if (split.state.size > split.state.getContainerSize()) {
    inverseMode = 'maximize';
  }

  if (inverse && inverseMode !== 'resize') {
    if (inverseMode === 'maximize') {
      inverseMode = 'minimize';
    } else {
      inverseMode = 'maximize';
    }
  }

  const handlers = useObjectRef(() => ({
    handleCollapse(event: React.SyntheticEvent<HTMLButtonElement>) {
      if (this.mode === 'maximize') {
        this.setMode('resize');
      } else {
        this.setMode('minimize');
      }
    },
    handleExpand(event: React.SyntheticEvent<HTMLButtonElement>) {
      if (this.mode === 'minimize') {
        this.setMode('resize');
      } else {
        this.setMode('maximize');
      }
    },
  }), { mode: split.state.mode, setMode: split.state.setMode }, ['handleCollapse', 'handleExpand']);

  return styled(buttonStyles)(
    <container
      onMouseDown={split.state.onMouseDown}
      onTouchStart={split.state.onTouchStart}
      onTouchEnd={split.state.onTouchEnd}
      onClick={split.state.onClick}
      onDoubleClick={split.state.onDoubleClick}
      {...use({ split: split.state.split, inverse, mode: inverseMode })}
    >
      {split.state.mode !== 'minimize' && (
        <button
          type="button"
          {...use({ isPrimary: !inverse })}
          onClick={handlers.handleCollapse}
        >
          <ripple />
        </button>
      )}
      {split.state.mode !== 'maximize' && (
        <button
          type="button"
          {...use({ isPrimary: inverse })}
          onClick={handlers.handleExpand}
        >
          <ripple />
        </button>
      )}
    </container>
  );
};
