/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { DATA_CONTEXT_USER, UserInfoResource } from '@cloudbeaver/core-authentication';
import { Icon, Loader, s, useS } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { UserInfo } from '../UserInfo.js';
import { MENU_USER_PROFILE } from './MENU_USER_PROFILE.js';
import style from './UserMenu.module.css';

export const UserMenu = observer(function UserMenu() {
  const styles = useS(style);
  const userInfoResource = useService(UserInfoResource);
  const menu = useMenu({ menu: MENU_USER_PROFILE });

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_USER, userInfoResource.data, id);
  });

  if (!userInfoResource.isAuthenticated()) {
    return null;
  }

  return (
    <Loader suspense inline>
      <UserInfo info={userInfoResource.data} />
      <ContextMenu className={s(styles, { contextMenu: true })} menu={menu} modal>
        <Icon className={s(styles, { icon: true })} name="angle" viewBox="0 0 15 8" />
      </ContextMenu>
    </Loader>
  );
});
