/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ButtonHTMLAttributes } from 'react';
import styled, { css } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';
import type { RequireAtLeastOne } from '@cloudbeaver/core-utils';

import { Button } from './Button';
import { IconOrImage } from './IconOrImage';

const styles = composes(
  css`
    Button {
      composes: theme-ripple from global;
    }
  `,
  css`
    Button {
      height: 100%;
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
      padding-left: 8px
    }
  `
);

interface Props extends ButtonHTMLAttributes<any> {
  label?: string;
  icon?: string;
  viewBox?: string;
}

export const LabeledIconButton: React.FC<RequireAtLeastOne<Props, 'label' | 'icon'>> = function LabeledIconButton({ label, icon, viewBox, ...rest }) {
  return styled(useStyles(styles))(
    <Button as="button" {...rest}>
      {icon && <IconOrImage icon={icon} viewBox={viewBox} />}
      {label && <button-label as="div">{label}</button-label>}
    </Button>
  );
};
