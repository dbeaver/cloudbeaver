/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SplitContext } from 'go-split';
import {
  useCallback, useContext, useState, useEffect
} from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { buttonStyles } from './splitButtonStyles';

export const SplitControls: React.FC = function SplitControls() {
  const {
    split, mode, isResizing, setMode, setSize, isMainSecond, getMainSize, ...splitContext
  } = useContext(SplitContext);
  const [state, setState] = useState(-1);
  const styles = useStyles(buttonStyles);

  const inverse = isMainSecond();
  let inverseMode = mode;
  if (inverse && mode !== 'resize') {
    if (mode === 'maximize') {
      inverseMode = 'minimize';
    } else {
      inverseMode = 'maximize';
    }
  }

  useEffect(() => {
    setState(getMainSize());
  }, [isResizing]);

  const handleCollapse = useCallback((event: React.SyntheticEvent<HTMLButtonElement>) => {
    if (mode === 'maximize') {
      setMode('resize');
      setSize(state);
    } else {
      setMode('minimize');
      setState(getMainSize());
    }
  }, [mode, state, setMode]);

  const handleExpand = useCallback((event: React.SyntheticEvent<HTMLButtonElement>) => {
    if (mode === 'minimize') {
      setMode('resize');
      setSize(state);
    } else {
      setMode('maximize');
      setState(getMainSize());
    }
  }, [mode, state, setMode]);

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
