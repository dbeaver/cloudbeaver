/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { IconOrImage, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { UserInfo as IUserInfo } from '@cloudbeaver/core-sdk';

import styles from './UserInfo.m.css';
import { UserProfileService } from './UserProfileService';

interface Props {
  info: IUserInfo;
}

export const UserInfo = observer<Props>(function UserInfo({ info }) {
  const translate = useTranslate();
  const userProfileService = useService(UserProfileService);
  const style = useS(styles);

  return (
    <div className={s(style, { user: true })} title={translate('plugin_user_profile_menu')} onClick={() => userProfileService.open()}>
      <IconOrImage className={s(style, { iconOrImage: true })} icon="/icons/plugin_user_profile_m.svg" />
      <div className={s(style, { userName: true })}>{info.displayName || info.userId}</div>
    </div>
  );
});
