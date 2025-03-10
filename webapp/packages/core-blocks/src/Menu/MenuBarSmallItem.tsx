/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ButtonProps } from 'reakit';

import { IconButton } from '../IconButton.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import moduleStyles from './MenuBarSmallItem.module.css';

interface Props extends Omit<ButtonProps, 'style' | 'icon'> {
  icon?: string;
  viewBox?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const MenuBarSmallItem: React.FC<React.PropsWithChildren<Props>> = function MenuBarSmallItem({
  icon,
  viewBox,
  children,
  className,
  onClick,
  ...rest
}) {
  const style = useS(moduleStyles);
  // TODO: replace IconButton with StaticImage / Icon
  // TODO: use button for icon-box (maybe)
  return (
    <div className={s(style, { iconBox: true }, className)} tabIndex={0} onClick={onClick}>
      {icon && <IconButton className={s(style, { iconButton: true })} name={icon} viewBox={viewBox} {...rest} />}
      {children && <div className={s(style, { iconLabel: true })}>{children}</div>}
    </div>
  );
};
