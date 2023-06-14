/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { useTranslate } from '../localization/useTranslate';
import { useStyles } from '../useStyles';
import { MenuItem } from './MenuItem';
import { MenuItemElement } from './MenuItemElement';
import { menuPanelStyles } from './menuPanelStyles';

interface Props extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  style?: ComponentStyle;
}

export const MenuEmptyItem = observer<Props>(function MenuEmptyItem({ style }) {
  const styles = useStyles(menuPanelStyles, style);
  const translate = useTranslate();

  const label = translate('core_ui_empty');

  return styled(styles)(
    <MenuItem id="empty" label={label} disabled>
      <MenuItemElement label={label} style={style} />
    </MenuItem>,
  );
});
