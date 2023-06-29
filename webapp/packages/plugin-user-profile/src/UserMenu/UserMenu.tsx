/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AuthInfoService, DATA_CONTEXT_USER } from '@cloudbeaver/core-authentication';
import { Icon, Loader, s, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { UserInfo } from '../UserInfo';
import { MENU_USER_PROFILE } from './MENU_USER_PROFILE';
import style from './UserMenu.m.css';

export const UserMenu = observer(function UserMenu() {
  const styles = useS(style);
  const authInfoService = useService(AuthInfoService);
  const menu = useMenu({ menu: MENU_USER_PROFILE });

  menu.context.set(DATA_CONTEXT_USER, authInfoService.userInfo);

  if (!authInfoService.userInfo) {
    return null;
  }

  return (
    <Loader suspense inline>
      <UserInfo info={authInfoService.userInfo} />
      <ContextMenu className={s(styles, { contextMenu: true })} menu={menu} rtl modal>
        <Icon className={s(styles, { icon: true })} name="angle" viewBox="0 0 15 8" />
      </ContextMenu>
    </Loader>
  );
});
