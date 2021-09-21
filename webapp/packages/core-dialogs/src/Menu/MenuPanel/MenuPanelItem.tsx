/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { Checkbox, Icon, IconOrImage, Loader, Radio } from '@cloudbeaver/core-blocks';
import type { IMenuItem } from '@cloudbeaver/core-dialogs';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';
import { use } from '@reshadow/react';

import { menuPanelStyles } from './menuPanelStyles';

interface MenuPanelItemProps {
  menuItem: IMenuItem;
  style?: ComponentStyle;
}

export const MenuPanelItem = observer<MenuPanelItemProps>(function MenuPanelItem({
  menuItem,
  style = [],
}) {
  let control = null;

  if (menuItem.type === 'radio') {
    control = <Radio checked={menuItem.isChecked} mod={['primary', 'small']} ripple={false} />;
  } else if (menuItem.type === 'checkbox') {
    control = <Checkbox checked={menuItem.isChecked} mod={['primary', 'small']} style={style} ripple={false} />;
  }

  return styled(useStyles(menuPanelStyles, style))(
    <menu-panel-item {...use({ separator: menuItem.separator })}>
      <menu-item-content>
        {menuItem.icon ? (
          <IconOrImage icon={menuItem.icon} />
        ) : control}
      </menu-item-content>
      <menu-item-text>
        <Translate token={menuItem.title} />
      </menu-item-text>
      <menu-item-content>
        {menuItem.panel && (
          menuItem.isProcessing ? <Loader small fullSize /> : <Icon name="arrow" viewBox="0 0 16 16" />
        )}
      </menu-item-content>
    </menu-panel-item>

  );
});
