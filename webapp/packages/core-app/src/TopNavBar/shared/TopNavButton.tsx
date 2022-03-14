/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { ButtonHTMLAttributes } from 'react';
import { Button } from 'reakit/Button';
import styled, { css, use } from 'reshadow';

import { Icon, IconOrImage, Loader } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';

import { topMenuStyles } from './topMenuStyles';

const elementStyle = css`
    Button {
      composes: theme-ripple from global;
      background: none;
      border: none;
      outline: none !important;
      color: inherit;
      cursor: pointer;
    }
    box {
      display: flex;
      align-items: center;
      flex: 1;
      height: inherit;
      position: relative;
    }
    menu-trigger-icon {
      width: 24px;
      height: 24px;
      display: flex;
      box-sizing: border-box;
      align-items: center;
      justify-content: center;
    }
    menu-trigger-icon IconOrImage {
      display: block;
      object-fit: contain;
    }
  `
;

interface IProps extends Omit<ButtonHTMLAttributes<any>, 'style'> {
  title?: string;
  icon?: string;
  menu?: boolean;
  secondary?: boolean;
  loading?: boolean;
  style?: ComponentStyle;
}

export const TopNavButton = observer<IProps, HTMLButtonElement>(function TopNavButton({ title, icon, secondary, menu, loading, style, ...props }, ref) {
  const translate = useTranslate();
  const styles = useStyles(style, topMenuStyles, elementStyle);

  title = translate(title);

  return styled(styles)(
    <Button type="button" {...props} ref={ref}>
      <box>
        {(icon || loading) && (
          <menu-trigger-icon {...use({ loading })}>
            <Loader secondary={secondary} loading={loading} small>{icon && <IconOrImage icon={icon} />}</Loader>
          </menu-trigger-icon>
        )}
        <menu-trigger-text title={title}>{title}</menu-trigger-text>
        {menu && <Icon name="angle" viewBox="0 0 15 8" />}
      </box>
    </Button>
  );
}, { forwardRef: true });
