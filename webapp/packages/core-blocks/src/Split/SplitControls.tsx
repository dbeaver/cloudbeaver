/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SplitContext } from 'go-split';
import { useCallback, useContext } from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

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

  const handleCollapse = useCallback((event: React.SyntheticEvent<HTMLButtonElement>) => {
    if (mode === 'maximize') {
      setMode('resize');
    } else {
      setMode('minimize');
    }
  }, [mode, setMode]);

  const handleExpand = useCallback((event: React.SyntheticEvent<HTMLButtonElement>) => {
    if (mode === 'minimize') {
      setMode('resize');
    } else {
      setMode('maximize');
    }
  }, [mode, setMode]);

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
          onClick={handleCollapse}
        >
          <ripple />
        </button>
      )}
      {mode !== 'maximize' && (
        <button
          type="button"
          {...use({ isPrimary: inverse })}
          onClick={handleExpand}
        >
          <ripple />
        </button>
      )}
    </container>
  );
};
