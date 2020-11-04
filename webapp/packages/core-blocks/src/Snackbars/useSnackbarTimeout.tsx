/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

export function useSnackbarTimeout(onClose: () => void, closeDelay: number, animate = true) {
  useEffect(() => {
    if (!animate) {
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
