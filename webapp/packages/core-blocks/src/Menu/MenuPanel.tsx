/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { Children } from 'react';
import { Menu, MenuStateReturn } from 'reakit/Menu';
import styled, { use } from 'reshadow';

import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { MenuEmptyItem } from './MenuEmptyItem';
import { menuPanelStyles } from './menuPanelStyles';


export interface IMenuPanelProps {
  label: string;
  menu: MenuStateReturn; // from reakit useMenuState
  panelAvailable?: boolean;
  hasBindings?: boolean;
  rtl?: boolean;
  style?: ComponentStyle;
}

export const MenuPanel = observer<IMenuPanelProps>(function MenuPanel({
  label,
  menu,
  panelAvailable = true,
  hasBindings,
  rtl,
  children,
  style,
}) {
  const styles = useStyles(menuPanelStyles, style);
  const visible = menu.visible;

  if (!visible) {
    return null;
  }

  return styled(styles)(
    <Menu {...menu} aria-label={label} visible={panelAvailable}>
      <menu-box dir={rtl ? 'rtl' : undefined} {...use({ hasBindings })}>
        {Children.count(children) === 0 && (
          <MenuEmptyItem style={style} />
        )}
        {children}
      </menu-box>
    </Menu>
  );
});