/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { Icon, IconOrImage, Loader, useStateDelay } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';

import { menuPanelStyles } from './menuPanelStyles';

interface IMenuItemElementProps {
  label: string;
  tooltip?: string;
  binding?: string;
  icon?: string | React.ReactNode;
  menu?: boolean;
  loading?: boolean;
  style?: ComponentStyle;
}

export const MenuItemElement = observer<IMenuItemElementProps>(function MenuItemElement({
  label,
  tooltip,
  binding,
  icon,
  menu,
  loading = false,
  style = [],
}) {
  const translate = useTranslate();

  const title = translate(label);
  loading = useStateDelay(loading, 100);

  return styled(useStyles(menuPanelStyles, style))(
    <menu-panel-item title={tooltip ? translate(tooltip) : title}>
      <menu-item-content>
        {typeof icon === 'string' ? <IconOrImage icon={icon} /> : icon}
      </menu-item-content>
      <menu-item-text title={title}>
        {title}
      </menu-item-text>
      <menu-item-binding title={binding}>
        {binding}
      </menu-item-binding>
      <menu-item-content>
        {loading && <Loader small fullSize />}
        {menu && !loading && <Icon name="arrow" viewBox="0 0 16 16" />}
      </menu-item-content>
    </menu-panel-item>

  );
});
