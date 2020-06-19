/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SplitContext } from 'go-split';
import {
  useCallback, useContext, useState, useEffect,
} from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { buttonStyles } from './splitButtonStyles';

export function SplitControls() {
  const {
    split, mode, isResizing, setMode, setSize, isMainSecond, getMainSize,
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
    if (isResizing) {
      setState(getMainSize());
    }
  }, [isResizing]);

  const handleCollapse = useCallback((event: React.SyntheticEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (mode === 'maximize') {
      setMode('resize');
      setSize(state);
    } else {
      setMode('minimize');
      setState(getMainSize());
    }
  }, [mode, setMode]);

  const handleExpand = useCallback((event: React.SyntheticEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (mode === 'minimize') {
      setMode('resize');
      setSize(state);
    } else {
      setMode('maximize');
      setState(getMainSize());
    }
  }, [mode, setMode]);

  return styled(styles)(
    <container as="div" {...use({ split, inverse, mode: inverseMode })}>
      {mode !== 'minimize' && (
        <button
          type="button"
          {...use({ isPrimary: !inverse })}
          onMouseDown={handleCollapse}
        >
          <ripple as="div" />
        </button>
      )}
      {mode !== 'maximize' && (
        <button
          type="button"
          {...use({ isPrimary: inverse })}
          onMouseDown={handleExpand}
        >
          <ripple as="div" />
        </button>
      )}
    </container>
  );
}
