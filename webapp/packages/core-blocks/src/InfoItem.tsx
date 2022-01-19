/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { TLocalizationToken, useTranslate } from '@cloudbeaver/core-localization';

import { IconOrImage } from './IconOrImage';

export interface IInfoItem {
  info: TLocalizationToken;
  icon?: string;
}

interface Props extends IInfoItem {
  className?: string;
}

const styles = css`
  info-item {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
  }
  IconOrImage {
    width: 24px;
    height: 24px;
    margin-right: 16px;
  }
`;

export const InfoItem = observer<Props>(function InfoItem({ info, icon = '/icons/info_icon.svg', className }) {
  const translate = useTranslate();
  return styled(styles)(
    <info-item className={className}>
      <IconOrImage icon={icon} />
      {translate(info)}
    </info-item>
  );
});
