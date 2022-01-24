/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { MenuItem, MenuStateReturn } from 'reakit/Menu';
import styled from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { MenuItemElement } from './MenuItemElement';
import { menuPanelStyles } from './menuPanelStyles';


interface Props extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  menu: MenuStateReturn; // from reakit useMenuState
  style?: ComponentStyle;
}

export const MenuEmptyItem = observer<Props>(function MenuEmptyItem({
  menu, style,
}) {
  const styles = useStyles(menuPanelStyles, style);
  const translate = useTranslate();

  const label = translate('core_ui_empty');

  return styled(styles)(
    <MenuItem
      {...menu}
      id='empty'
      aria-label={label}
      disabled
    >
      <MenuItemElement label={label} style={style} />
    </MenuItem>
  );
});