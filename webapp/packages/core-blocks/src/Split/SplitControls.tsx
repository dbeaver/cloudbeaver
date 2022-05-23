/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SplitContext } from 'go-split';
import { useContext } from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { useObjectRef } from '../useObjectRef';
import { buttonStyles } from './splitButtonStyles';

export const SplitControls: React.FC = function SplitControls() {
  const {
    size, split, mode, setMode, isMainSecond, getContainerSize, ...splitContext
  } = useContext(SplitContext);
  const styles = useStyles(buttonStyles);

  const inverse = isMainSecond();

  let inverseMode = mode;

  if (size > getContainerSize()) {
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
  }), { mode, setMode }, ['handleCollapse', 'handleExpand']);

  return styled(styles)(
    <container
      onMouseDown={splitContext.onMouseDown}
      onTouchStart={splitContext.onTouchStart}
      onTouchEnd={splitContext.onTouchEnd}
      onClick={splitContext.onClick}
      onDoubleClick={splitContext.onDoubleClick}
      {...use({ split, inverse, mode: inverseMode })}
    >
      {mode !== 'minimize' && (
        <button
          type="button"
          {...use({ isPrimary: !inverse })}
          onClick={handlers.handleCollapse}
        >
          <ripple />
        </button>
      )}
      {mode !== 'maximize' && (
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
