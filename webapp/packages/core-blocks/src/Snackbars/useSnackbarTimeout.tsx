/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import { ENotificationType } from '@cloudbeaver/core-events';

interface IUseSnackbarTimeoutProps {
  closeAfter?: number;
  onClose?: (deletingDelay?: boolean) => void;
  type?: ENotificationType;
}

export function useSnackbarTimeout(
  { closeAfter, onClose, type }: IUseSnackbarTimeoutProps) {
  useEffect(() => {
    if (type !== ENotificationType.Success || !closeAfter) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, closeAfter);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [closeAfter, onClose, type]);
}
