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
