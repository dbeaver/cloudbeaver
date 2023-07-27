/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useState } from 'react';

import { IconButton } from '../../IconButton';
import { s } from '../../s';
import { useS } from '../../useS';
import style from './SnackbarWrapper.m.css';

interface Props {
  closing?: boolean;
  persistent?: boolean;
  onClose?: () => void;
  className?: string;
}

export const SnackbarWrapper: React.FC<React.PropsWithChildren<Props>> = function SnackbarWrapper({
  closing = false,
  persistent,
  onClose,
  children,
  className,
}) {
  const styles = useS(style);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div data-testid="notification" className={s(styles, { notification: true, mounted, closing }, className)}>
      {children}
      {!persistent && onClose && (
        <IconButton name="cross" viewBox="0 0 16 16" className={s(styles, { iconButton: true, large: true })} onClick={onClose} />
      )}
    </div>
  );
};
