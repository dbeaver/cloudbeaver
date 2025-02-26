/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type React from 'react';
import { type ButtonProps, Button as ReakitButton } from 'reakit';

import { Icon } from './Icon.js';
import IconButtonStyles from './IconButton.module.css';
import { s } from './s.js';
import { StaticImage } from './StaticImage.js';
import { useS } from './useS.js';

interface Props {
  tag?: 'button' | 'a' | 'div';
  name: string;
  img?: boolean;
  viewBox?: string;
}

export type IconButtonProps = Props & ButtonProps;

export const IconButton: React.FC<IconButtonProps> = observer(function IconButton({ tag, name, img, viewBox, className, ...rest }) {
  const styles = useS(IconButtonStyles);

  const Button = tag ?? ReakitButton;

  return (
    <Button tabIndex={0} {...rest} className={s(styles, { iconButton: true }, className)}>
      <div className={s(styles, { iconBox: true })}>
        {img && <StaticImage className={s(styles, { staticImage: true })} icon={name} />}
        {!img && <Icon className={s(styles, { icon: true })} name={name} viewBox={viewBox} />}
      </div>
    </Button>
  );
});
