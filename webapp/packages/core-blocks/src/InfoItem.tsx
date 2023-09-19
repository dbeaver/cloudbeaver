/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { TLocalizationToken } from '@cloudbeaver/core-localization';

import { IconOrImage } from './IconOrImage';
import style from './InfoItem.m.css';
import { useTranslate } from './localization/useTranslate';
import { s } from './s';
import { useS } from './useS';

export interface IInfoItem {
  info: TLocalizationToken;
  icon?: string;
}

interface Props extends IInfoItem {
  className?: string;
}

export const InfoItem = observer<Props>(function InfoItem({ info, icon = '/icons/info_icon.svg', className }) {
  const styles = useS(style);

  const translate = useTranslate();
  return (
    <div className={s(styles, { infoItem: true }, className)}>
      <IconOrImage className={s(styles, { iconOrImage: true })} icon={icon} />
      {translate(info)}
    </div>
  );
});
