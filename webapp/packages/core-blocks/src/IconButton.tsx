/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Button, ButtonProps } from 'reakit/Button';
import styled, { css } from 'reshadow';

import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { Icon } from './Icon';
import { StaticImage } from './StaticImage';

const styles = css`
  Button {
    color: inherit;
    outline: none;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    margin: 4px;
    height: 16px;
    width: 16px;

    & Icon, & StaticImage {
      width: 100%;
      height: 100%;
    }
  }
`;

interface Props {
  name: string;
  img?: boolean;
  viewBox?: string;
  style?: ComponentStyle;
}

export function IconButton({ name, img, viewBox, style, ...rest }: Props & ButtonProps) {
  return styled(useStyles(styles, style))(
    <Button {...rest}>
      {img && <StaticImage icon={name} />}
      {!img && <Icon name={name} viewBox={viewBox} />}
    </Button>
  );
}
