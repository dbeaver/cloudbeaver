/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { use } from 'reshadow';

import { Icon } from '@dbeaver/core/blocks';
import { IMenuItem } from '@dbeaver/core/dialogs';
import { useTranslate } from '@dbeaver/core/localization';
import { useStyles, Style } from '@dbeaver/core/theming';

import { menuPanelStyles } from './menuPanelStyles';

type MenuPanelItemProps = {
  menuItem: IMenuItem;
  style?: Style[];
}

export const MenuPanelItem = observer(function MenuPanelItem({ menuItem, style = [] }: MenuPanelItemProps) {
  const translate = useTranslate();

  return styled(useStyles(menuPanelStyles, ...style))(
    <menu-panel-item as="div">
      <menu-item-text as="span">
        {translate(menuItem.title)}
      </menu-item-text>
      {menuItem.panel && <Icon name="arrow" viewBox="0 0 16 16" />}
    </menu-panel-item>
  );
});
