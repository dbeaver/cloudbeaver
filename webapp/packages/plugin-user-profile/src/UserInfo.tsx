/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { UserInfo as IUserInfo } from '@cloudbeaver/core-sdk';

import { UserProfileService } from './UserProfileService';

const styles = css`
  user {
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 8px;
    cursor: pointer;

    &:hover,
    &:global([aria-expanded='true']) {
      background: #338ecc;
    }

    &:after {
      position: absolute;
      background: #236ea0 !important;
      height: 32px;
      width: 1px;
      top: 8px;
      right: -1px;
      opacity: 1 !important;
      content: '';
    }
  }
  IconOrImage {
    display: block;
    width: 24px;
    height: 24px;
  }
  user-name {
    display: block;
    line-height: initial;
    margin-left: 8px;
  }
`;

interface Props {
  info: IUserInfo;
}

export const UserInfo = observer<Props>(function UserInfo({ info }) {
  const translate = useTranslate();
  const userProfileService = useService(UserProfileService);

  return styled(styles)(
    <user title={translate('plugin_user_profile_menu')} onClick={() => userProfileService.open()}>
      <user-icon>
        <IconOrImage icon="/icons/plugin_user_profile_m.svg" />
      </user-icon>
      <user-name>{info.displayName || info.userId}</user-name>
    </user>,
  );
});
