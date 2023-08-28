/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button, ButtonProps } from 'reakit/Button';
import styled from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { Icon } from './Icon';
import { s } from './s';
import { StaticImage } from './StaticImage';
import { useS } from './useS';
import { useStyles } from './useStyles';
import IconButtonStyles from './IconButton.m.css';

interface Props {
  name: string;
  img?: boolean;
  viewBox?: string;
  style?: ComponentStyle;
}

export function IconButton({ name, img, viewBox, style, className, ...rest }: Props & ButtonProps) {
  const styles = useS(IconButtonStyles);

  return styled(useStyles(style))(
    <Button {...rest} className={s(styles, { IconButton: true }, className)}>
      {img && <StaticImage className={s(styles, { StaticImage: true })} icon={name} />}
      {!img && <Icon className={s(styles, { Icon: true })} name={name} viewBox={viewBox} />}
    </Button>,
  );
}
