/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import styled from 'reshadow';

import { IconOrImage, Loader, useStateDelay, useTranslate, useStyles, Icon } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

interface Props extends Omit<React.DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'style'> {
  label?: string;
  /** @deprecated must be refactored (#1)*/
  displayLabel?: boolean;
  loading?: boolean;
  icon?: string | React.ReactNode;
  displaySubmenuMark?: boolean;
  viewBox?: string;
  style?: ComponentStyle;
}

export const MenuBarItem = observer<Props, HTMLButtonElement>(forwardRef(function MenuBarItem({
  label,
  displayLabel = true,
  loading = false,
  icon,
  displaySubmenuMark,
  viewBox = '0 0 24 24',
  style = [],
  ...rest
}, ref) {
  const translate = useTranslate();
  loading = useStateDelay(loading, 100);

  const title = translate(rest.title);
  return styled(useStyles(style))(
    <menu-bar-item ref={ref} as='button' {...rest} title={title} aria-label={title}>
      <menu-bar-item-box>
        {loading ? (
          <menu-bar-item-icon><Loader small fullSize /></menu-bar-item-icon>
        ) : icon && (
          <menu-bar-item-icon>
            {typeof icon === 'string' ? <IconOrImage icon={icon} viewBox={viewBox} /> : icon}
          </menu-bar-item-icon>
        )}
        {label && displayLabel ? (
          <menu-bar-item-label>{translate(label)}</menu-bar-item-label>
        ) : (<padding />)}
        {displaySubmenuMark && <menu-bar-item-mark><Icon name="angle" viewBox="0 0 15 8" /></menu-bar-item-mark>}
      </menu-bar-item-box>
    </menu-bar-item>
  );
}));
