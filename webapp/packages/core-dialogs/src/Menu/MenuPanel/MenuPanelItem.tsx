/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObserver } from 'mobx-react-lite';
import styled from 'reshadow';

import { Checkbox, Icon, IconOrImage, Radio } from '@cloudbeaver/core-blocks';
import type { IMenuItem } from '@cloudbeaver/core-dialogs';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';
import { use } from '@reshadow/react';

import { menuPanelStyles } from './menuPanelStyles';

interface MenuPanelItemProps {
  menuItem: IMenuItem;
  style?: ComponentStyle;
}

export const MenuPanelItem: React.FC<MenuPanelItemProps> = function MenuPanelItem({
  menuItem,
  style = [],
}) {
  const { title, panel, icon, isChecked, controlType, separator } = useObserver(() => ({ // TODO: provide title and panel via props
    title: menuItem.title,
    panel: menuItem.panel,
    icon: menuItem.icon,
    isChecked: menuItem.isChecked,
    controlType: menuItem.type,
    separator: menuItem.separator,
  }));

  let control = null;

  if (controlType === 'radio') {
    control = <Radio checked={isChecked} mod={['primary', 'small']} ripple={false} />;
  } else if (controlType === 'checkbox') {
    control = <Checkbox checked={isChecked} mod={['primary', 'small']} style={style} ripple={false} />;
  }

  return styled(useStyles(menuPanelStyles, style))(
    <menu-panel-item {...use({ separator })}>
      <menu-item-content>
        {icon ? (
          <IconOrImage icon={icon} />
        ) : control}
      </menu-item-content>
      <menu-item-text>
        <Translate token={title} />
      </menu-item-text>
      <menu-item-content>
        {panel && <Icon name="arrow" viewBox="0 0 16 16" />}
      </menu-item-content>
    </menu-panel-item>

  );
};
