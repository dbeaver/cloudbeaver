/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { Icon, IconOrImage, Loader, useStateDelay } from '@cloudbeaver/core-blocks';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';

import { menuPanelStyles } from './menuPanelStyles';

interface MenuPanelItemProps {
  label: string;
  tooltip?: string;
  binding?: string;
  icon?: string | React.ReactNode;
  menu?: boolean;
  loading?: boolean;
  style?: ComponentStyle;
}

export const MenuPanelItem = observer<MenuPanelItemProps>(function MenuPanelItem({
  label,
  tooltip,
  binding,
  icon,
  menu,
  loading = false,
  style = [],
}) {
  loading = useStateDelay(loading, 100);
  return styled(useStyles(menuPanelStyles, style))(
    <menu-panel-item title={tooltip}>
      <menu-item-content>
        {typeof icon === 'string' ? <IconOrImage icon={icon} /> : icon}
      </menu-item-content>
      <menu-item-text>
        <Translate token={label} />
      </menu-item-text>
      <menu-item-binding>
        {binding}
      </menu-item-binding>
      <menu-item-content>
        {loading && <Loader small fullSize />}
        {menu && !loading && <Icon name="arrow" viewBox="0 0 16 16" />}
      </menu-item-content>
    </menu-panel-item>

  );
});
