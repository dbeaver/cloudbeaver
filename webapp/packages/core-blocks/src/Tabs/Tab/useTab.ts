/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useContext } from 'react';

import { TabsContext } from '../TabsContext';

export function useTab(
  tabId: string,
  onOpen?: (tabId: string) => void,
  onClose?: (tabId: string) => void
) {
  const state = useContext(TabsContext);
  if (!state) {
    throw new Error('TabsContext not provided');
  }

  const handleOpen = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    // e.preventDefault();
    state.select(tabId);
    if (onOpen) {
      onOpen(tabId);
    }
  }, [state, onOpen, tabId]);

  const handleClose = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // e.preventDefault();
    e.stopPropagation(); // it's here because close triggers handleOpen too
    if (onClose) {
      onClose(tabId);
    }
  }, [onClose, tabId]);

  return { state, handleOpen, handleClose };
}
