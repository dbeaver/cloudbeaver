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

import { Icon } from '../Icon';
import { IconOrImage } from '../IconOrImage';
import { Loader } from '../Loader/Loader';
import { useTranslate } from '../localization/useTranslate';
import { useStateDelay } from '../useStateDelay';
import { useStyles } from '../useStyles';
import { menuPanelStyles } from './menuPanelStyles';

interface IMenuItemElementProps {
  label: string;
  /** @deprecated must be refactored (#1)*/
  displayLabel?: boolean;
  tooltip?: string;
  binding?: string;
  icon?: string | React.ReactNode;
  menu?: boolean;
  loading?: boolean;
  panelAvailable?: boolean;
  style?: ComponentStyle;
}

export const MenuItemElement = observer<IMenuItemElementProps>(function MenuItemElement({
  label,
  displayLabel = true,
  tooltip,
  binding,
  icon,
  menu,
  panelAvailable,
  loading = false,
  style = [],
}) {
  const translate = useTranslate();

  const title = translate(label);
  loading = useStateDelay(loading, 100);

  return styled(useStyles(menuPanelStyles, style))(
    <menu-panel-item title={tooltip ? translate(tooltip) : title}>
      <menu-item-icon>
        {typeof icon === 'string' ? <IconOrImage icon={icon} /> : icon}
      </menu-item-icon>
      {displayLabel ? (
        <menu-item-text title={title}>
          {title}
        </menu-item-text>
      ) : (<padding />)}
      <menu-item-binding title={binding}>
        {binding}
      </menu-item-binding>
      <menu-item-content>
        {loading && <Loader small fullSize />}
        {panelAvailable !== false && menu && !loading && <Icon name="context-menu-submenu" viewBox="0 0 6 7" />}
      </menu-item-content>
    </menu-panel-item>

  );
});
