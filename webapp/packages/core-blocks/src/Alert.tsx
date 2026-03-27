/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PropsWithChildren } from 'react';
import { observer } from 'mobx-react-lite';

import { useTranslate } from './localization/useTranslate.js';
import { useS } from './useS.js';
import { s } from './s.js';
import { IconOrImage } from './IconOrImage.js';
import classes from './Alert.module.css';

interface Props {
  title?: string;
  variant?: 'info' | 'error';
  className?: string;
}

export const Alert = observer<PropsWithChildren<Props>>(function Alert({ title, variant = 'info', className, children }) {
  const translate = useTranslate();
  const styles = useS(classes);

  const icon = variant === 'info' ? '/icons/preload/info_icon_sm.svg' : '/icons/preload/error_icon_sm.svg';

  return (
    <div className={s(styles, { alert: true, error: variant === 'error' }, className)} role="alert">
      <IconOrImage icon={icon} className="tw:mt-0.5 tw:size-5" />
      <div className={s(styles, { body: true })}>
        <h3 className={s(styles, { title: true })}>{title ?? translate(variant === 'info' ? 'ui_information' : 'ui_error')}</h3>
        {children}
      </div>
    </div>
  );
});
