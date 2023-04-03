/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';
import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { topMenuStyles } from '../shared/topMenuStyles';
import { MENU_BAR_ITEM_STYLES, MENU_BAR_DISABLE_EFFECT_STYLES, MENU_BAR_STYLES } from '../styles';
import { MENU_APP_STATE } from './MENU_APP_STATE';

const styles = css`
  MenuBarElement {
    & menu-bar-item-icon {
      margin-right: 0;
    }
    & menu-bar-item-label,
    & menu-bar-item-mark {
      display: none;
    }
  }
`;

export const AppStateMenu = observer(function AppStateMenu() {
  const menu = useMenu({ menu: MENU_APP_STATE });
  const { authenticated } = useService(AppAuthService);

  if (!authenticated) {
    return null;
  }

  return styled(MENU_BAR_STYLES)(
    <menu-wrapper>
      <MenuBar
        menu={menu}
        style={[styles, topMenuStyles, MENU_BAR_ITEM_STYLES, topMenuStyles, MENU_BAR_DISABLE_EFFECT_STYLES]}
        nestedMenuSettings={{ modal: true }}
        rtl
      />
    </menu-wrapper>
  );
});
