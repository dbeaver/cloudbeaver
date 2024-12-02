/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useState } from 'react';

import { ActionIconButton } from '../../ActionIconButton.js';
import { useTranslate } from '../../localization/useTranslate.js';
import { s } from '../../s.js';
import { useS } from '../../useS.js';
import style from './SnackbarWrapper.module.css';

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
  const translate = useTranslate();
  const styles = useS(style);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div tabIndex={0} role="status" aria-live="polite" aria-atomic="true" className={s(styles, { notification: true, mounted, closing }, className)}>
      {children}
      {!persistent && onClose && (
        <div className={s(styles, { iconButton: true })}>
          <ActionIconButton name="cross" viewBox="0 0 16 16" aria-label={translate('ui_close')} onClick={onClose} />
        </div>
      )}
    </div>
  );
};
