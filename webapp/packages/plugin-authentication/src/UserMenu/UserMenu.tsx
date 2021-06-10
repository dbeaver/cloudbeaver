/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { topMenuStyles } from '@cloudbeaver/core-app';
import { useService } from '@cloudbeaver/core-di';
import { MenuTrigger } from '@cloudbeaver/core-dialogs';
import { useStyles } from '@cloudbeaver/core-theming';

import { UserInfo } from '../UserInfo';
import { UserMenuService } from './UserMenuService';
import { userMenuStyles } from './userMenuStyles';

export const UserMenu = observer(function UserMenu() {
  const userMenuService = useService(UserMenuService);
  const style = useStyles(userMenuStyles);

  return styled(style)(
    <MenuTrigger panel={userMenuService.getMenu()} style={[topMenuStyles, userMenuStyles]}>
      <UserInfo />
    </MenuTrigger>
  );
});
