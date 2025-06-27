/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useTranslate } from './localization/useTranslate.js';
import { useS } from './useS.js';
import { s } from './s.js';
import { IconOrImage } from './IconOrImage.js';
import { Text } from './Text.js';
import classes from './Alert.module.css';

interface Props {
  message: string;
  title?: string;
  className?: string;
}

export const Alert = observer<Props>(function Alert({ title, message, className }) {
  const translate = useTranslate();
  const styles = useS(classes);

  return (
    <div className={s(styles, { alert: true }, className)} role="alert">
      <IconOrImage icon="/icons/info_icon_sm.svg" />
      <div className={s(styles, { body: true })}>
        <h3 className={s(styles, { title: true })}>{title ?? translate('ui_information')}</h3>
        <Text>{message}</Text>
      </div>
    </div>
  );
});
