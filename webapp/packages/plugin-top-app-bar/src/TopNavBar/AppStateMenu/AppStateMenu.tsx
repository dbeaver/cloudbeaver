/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { s, SContext, StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { MenuBar, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import style from '../shared/TopMenuWrapper.m.css';
import AppMenuBarItemStyles from './AppStateMenu.m.css';
import { MENU_APP_STATE } from './MENU_APP_STATE';

const registry: StyleRegistry = [
  [
    MenuBarItemStyles,
    {
      mode: 'append',
      styles: [AppMenuBarItemStyles],
    },
  ],
  [
    MenuBarStyles,
    {
      mode: 'append',
      styles: [AppMenuBarItemStyles],
    },
  ],
];

export const AppStateMenu = observer(function AppStateMenu() {
  const styles = useS(AppMenuBarItemStyles, style);
  const menu = useMenu({ menu: MENU_APP_STATE });
  const { authenticated } = useService(AppAuthService);

  if (!authenticated) {
    return null;
  }

  return (
    <SContext registry={registry}>
      <div className={s(styles, { menuWrapper: true, appStateMenu: true })}>
        <MenuBar menu={menu} nestedMenuSettings={{ modal: true }} rtl />
      </div>
    </SContext>
  );
});
