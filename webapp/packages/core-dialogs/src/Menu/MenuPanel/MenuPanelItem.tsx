/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObserver } from 'mobx-react';
import styled from 'reshadow';

import { Icon } from '@cloudbeaver/core-blocks';
import { IMenuItem } from '@cloudbeaver/core-dialogs';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles, Style } from '@cloudbeaver/core-theming';

import { menuPanelStyles } from './menuPanelStyles';

type MenuPanelItemProps = {
  menuItem: IMenuItem;
  style?: Style[];
}

export function MenuPanelItem({ menuItem, style = [] }: MenuPanelItemProps) {
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
}
