/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { usePermission } from '@cloudbeaver/core-blocks';
import { EPermission } from '@cloudbeaver/core-root';
import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import { MENU_BAR_DISABLE_EFFECT_STYLES, MENU_BAR_ITEM_STYLES, MENU_BAR_STYLES, topMenuStyles } from '@cloudbeaver/plugin-top-app-bar';

import { MENU_APP_ADMINISTRATION_ACTIONS } from './MENU_APP_ADMINISTRATION_ACTIONS';

export const AdministrationMenu = observer(function AdministrationMenu() {
  const menu = useMenu({ menu: MENU_APP_ADMINISTRATION_ACTIONS });
  const isEnabled = usePermission(EPermission.public);

  if (!isEnabled) {
    return null;
  }

  return styled(MENU_BAR_STYLES)(
    <menu-wrapper>
      <MenuBar
        menu={menu}
        style={[topMenuStyles, MENU_BAR_ITEM_STYLES, topMenuStyles, MENU_BAR_DISABLE_EFFECT_STYLES]}
        nestedMenuSettings={{ modal: true }}
      />
    </menu-wrapper>
  );
});
