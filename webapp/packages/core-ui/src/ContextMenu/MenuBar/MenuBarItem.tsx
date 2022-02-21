/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { ButtonHTMLAttributes } from 'react';
import styled from 'reshadow';

import { IconOrImage, Loader, useStateDelay } from '@cloudbeaver/core-blocks';
import { Translate, useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

interface Props extends Omit<React.DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'style'> {
  label?: string;
  loading?: boolean;
  icon?: string;
  viewBox?: string;
  style?: ComponentStyle;
}

export const MenuBarItem = observer<Props, HTMLButtonElement>(function MenuBarItem({
  label,
  loading = false,
  icon,
  viewBox = '0 0 24 24',
  style = [],
  ...rest
}, ref) {
  const translate = useTranslate();
  loading = useStateDelay(loading, 100);

  const title = translate(rest.title);
  return styled(useStyles(style))(
    <menu-bar-item ref={ref} as='button' {...rest} title={title} aria-label={title}>
      {loading && <Loader small fullSize />}
      {!loading && icon && <IconOrImage icon={icon} viewBox={viewBox} />}
      {label && <item-label><Translate token={label} /></item-label>}
    </menu-bar-item>
  );
}, { forwardRef: true });
