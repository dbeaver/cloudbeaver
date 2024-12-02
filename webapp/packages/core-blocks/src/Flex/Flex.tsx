/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { forwardRef } from 'react';

import { s } from '../s.js';
import classes from './Flex.module.css';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  overflow?: boolean;
  gap?: 'xs' | 'md' | 'lg';
  wrap?: React.CSSProperties['flexWrap'];
  direction?: React.CSSProperties['flexDirection'];
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
}

export const Flex = forwardRef<HTMLDivElement, Props>(function Flex(
  { overflow, gap, wrap, direction, align, justify, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      {...rest}
      className={s(classes, { flex: true, overflow }, className)}
      data-s-gap={gap}
      data-s-wrap={wrap}
      data-s-direction={direction}
      data-s-align={align}
      data-s-justify={justify}
    >
      {children}
    </div>
  );
});
