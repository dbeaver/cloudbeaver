/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { s, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import style from '../shared/TopMenuWrapper.m.css';
import { MENU_APP_ACTIONS } from './MENU_APP_ACTIONS';

export const MainMenu = observer(function MainMenu() {
  const styles = useS(style);
  const menu = useMenu({ menu: MENU_APP_ACTIONS });
  const { authenticated } = useService(AppAuthService);

  if (!authenticated) {
    return null;
  }

  return (
    <div className={s(styles, { menuWrapper: true })}>
      <MenuBar menu={menu} nestedMenuSettings={{ modal: true }} />
    </div>
  );
});
