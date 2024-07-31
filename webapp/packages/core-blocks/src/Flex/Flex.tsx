/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { forwardRef } from 'react';

import { clsx } from '@cloudbeaver/core-utils';

import classes from './Flex.module.css';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  overflow?: boolean;
  gap?: 'xs' | 'md' | 'lg';
  wrap?: React.CSSProperties['flexWrap'];
  direction?: React.CSSProperties['flexDirection'];
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
}

const gapClasses: Record<string, string> = {
  xs: classes.gapXs,
  md: classes.gapMd,
  lg: classes.gapLg,
};

const wrapClasses: Record<string, string> = {
  wrap: classes.wrapWrap,
  nowrap: classes.wrapNoWrap,
  'wrap-reverse': classes.wrapWrapReverse,
};

const directionClasses: Record<string, string> = {
  row: classes.directionRow,
  column: classes.directionColumn,
  'row-reverse': classes.directionRowReverse,
  'column-reverse': classes.directionColumnReverse,
};

const alignClasses: Record<string, string> = {
  'flex-start': classes.alignStart,
  center: classes.alignCenter,
  'flex-end': classes.alignEnd,
  stretch: classes.alignStretch,
};

const justifyClasses: Record<string, string> = {
  'flex-start': classes.justifyStart,
  center: classes.justifyCenter,
  'flex-end': classes.justifyEnd,
  'space-between': classes.justifySpaceBetween,
  'space-around': classes.justifySpaceAround,
  'space-evenly': classes.justifySpaceEvenly,
};

export const Flex = forwardRef<HTMLDivElement, Props>(function Flex(
  { overflow, gap, wrap, direction, align, justify, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(
        classes.flex,
        overflow && classes.overflow,
        gap && gapClasses[gap],
        wrap && wrapClasses[wrap],
        direction && directionClasses[direction],
        align && alignClasses[align],
        justify && justifyClasses[justify],
        className,
      )}
    >
      {children}
    </div>
  );
});
