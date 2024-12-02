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
import { TopMenuWrapperStyles } from '@cloudbeaver/plugin-top-app-bar';

import { MENU_APP_ADMINISTRATION_ACTIONS } from './MENU_APP_ADMINISTRATION_ACTIONS.js';

export const AdministrationMenu = observer(function AdministrationMenu() {
  const styles = useS(TopMenuWrapperStyles);
  const menu = useMenu({ menu: MENU_APP_ADMINISTRATION_ACTIONS });
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
