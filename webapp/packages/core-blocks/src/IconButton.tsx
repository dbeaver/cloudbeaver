/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type React from 'react';
import { ButtonProps, Button as ReakitButton } from 'reakit/Button';
import styled from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { Icon } from './Icon';
import IconButtonStyles from './IconButton.m.css';
import { s } from './s';
import { StaticImage } from './StaticImage';
import { useS } from './useS';
import { useStyles } from './useStyles';

interface Props {
  tag?: 'button' | 'a' | 'div';
  name: string;
  img?: boolean;
  viewBox?: string;
  style?: ComponentStyle;
}

export type IconButtonProps = Props & ButtonProps;

export const IconButton: React.FC<IconButtonProps> = observer(function IconButton({ tag, name, img, viewBox, style, className, ...rest }) {
  const styles = useS(IconButtonStyles);

  const Button = tag ?? ReakitButton;

  return styled(useStyles(style))(
    <Button {...rest} className={s(styles, { iconButton: true }, className)}>
      {img && <StaticImage className={s(styles, { staticImage: true })} icon={name} />}
      {!img && <Icon className={s(styles, { icon: true })} name={name} viewBox={viewBox} />}
    </Button>,
  );
});
