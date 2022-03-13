/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ButtonHTMLAttributes } from 'react';
import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { IconOrImage } from '../IconOrImage';

const styles = css`
    button {
      composes: theme-ripple from global;
      padding: 0 16px;
      display: flex;
      align-items: center;
      cursor: pointer;
      background: transparent;
      outline: none;
      color: inherit;
    }
    IconOrImage {
      display: block;
      width: 24px;
    }
    button-label {
      display: block;
      text-transform: uppercase;
      font-weight: 700;
    }
    IconOrImage + button-label {
      padding-left: 8px
    }
  `;

interface Props extends ButtonHTMLAttributes<any> {
  icon?: string;
  viewBox?: string;
}

export const ToolsAction: React.FC<Props> = function ToolsAction({ icon, viewBox, children, ...rest }) {
  return styled(useStyles(styles))(
    <button type='button' {...rest}>
      {icon && <IconOrImage icon={icon} viewBox={viewBox} />}
      {children && <button-label>{children}</button-label>}
    </button>
  );
};
