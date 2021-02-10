/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObserver } from 'mobx-react-lite';
import styled from 'reshadow';

import { Icon } from '@cloudbeaver/core-blocks';
import type { IMenuItem } from '@cloudbeaver/core-dialogs';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles, Style } from '@cloudbeaver/core-theming';

import { menuPanelStyles } from './menuPanelStyles';

interface MenuPanelItemProps {
  menuItem: IMenuItem;
  style?: Style[];
}

export const MenuPanelItem: React.FC<MenuPanelItemProps> = function MenuPanelItem({
  menuItem,
  style = [],
}) {
  const { title, panel } = useObserver(() => ({ // TODO: provide title and panel via props
    title: menuItem.title,
    panel: menuItem.panel,
  }));

  return styled(useStyles(menuPanelStyles, ...style))(
    <menu-panel-item as="div">
      <menu-item-text as="span">
        <Translate token={title} />
      </menu-item-text>
      {panel && <Icon name="arrow" viewBox="0 0 16 16" />}
    </menu-panel-item>
  );
};
