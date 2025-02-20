/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2024 DBeaver Corp
 *
 * All Rights Reserved
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
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
}

export const Alert = observer<Props>(function Alert({ title, message }) {
  const translate = useTranslate();
  const styles = useS(classes);

  return (
    <div className={s(styles, { alert: true })} role="alert">
      <IconOrImage icon="/icons/info_icon_sm.svg" />
      <div className={s(styles, { body: true })}>
        <h3 className={s(styles, { title: true })}>{title ?? translate('ui_information')}</h3>
        <Text>{message}</Text>
      </div>
    </div>
  );
});
