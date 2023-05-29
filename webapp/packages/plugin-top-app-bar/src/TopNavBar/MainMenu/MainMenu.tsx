/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';
import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { topMenuStyles } from '../shared/topMenuStyles';
import { MENU_BAR_DISABLE_EFFECT_STYLES, MENU_BAR_ITEM_STYLES, MENU_BAR_STYLES } from '../styles';
import { MENU_APP_ACTIONS } from './MENU_APP_ACTIONS';

export const MainMenu = observer(function MainMenu() {
  const menu = useMenu({ menu: MENU_APP_ACTIONS });
  const { authenticated } = useService(AppAuthService);

  if (!authenticated) {
    return null;
  }

  return styled(MENU_BAR_STYLES)(
    <menu-wrapper>
      <MenuBar
        menu={menu}
        style={[topMenuStyles, MENU_BAR_ITEM_STYLES, topMenuStyles, MENU_BAR_DISABLE_EFFECT_STYLES]}
        nestedMenuSettings={{ modal: true }}
      />
    </menu-wrapper>,
  );
});
