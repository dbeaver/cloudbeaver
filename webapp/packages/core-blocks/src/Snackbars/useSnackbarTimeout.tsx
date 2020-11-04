/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

interface IUseSnackbarTimeoutProps {
  closeDelay?: number;
  onClose?: (deletingDelay?: boolean) => void;
  animate?: boolean;
}

export function useSnackbarTimeout({ closeDelay, onClose, animate = true }: IUseSnackbarTimeoutProps) {
  useEffect(() => {
    if (!onClose || !animate || !closeDelay) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onClose();
    }, closeDelay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [closeDelay, onClose, animate]);
}
