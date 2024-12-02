/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { forwardRef } from 'react';

import { s } from '../s.js';
import { useS } from '../useS.js';
import containerStyles from './Container.module.css';
import { filterContainerFakeProps, getContainerProps } from './filterContainerFakeProps.js';
import style from './Group.module.css';
import type { IContainerProps } from './IContainerProps.js';
import elementsSizeStyles from './shared/ElementsSize.module.css';

interface Props extends IContainerProps {
  form?: boolean;
  secondary?: boolean;
  center?: boolean;
  box?: boolean;
  border?: boolean;
  hideOverflow?: boolean;
  boxNoOverflow?: boolean;
}

export const Group = forwardRef<HTMLDivElement, Props & React.HTMLAttributes<HTMLDivElement>>(function Group(
  { form, center, box, border, secondary, boxNoOverflow, hideOverflow, className, ...rest },
  ref,
) {
  const styles = useS(style, containerStyles, elementsSizeStyles);
  const divProps = filterContainerFakeProps(rest);
  const containerProps = getContainerProps(rest);

  return (
    <div
      ref={ref}
      role="group"
      tabIndex={-1}
      {...divProps}
      className={s(
        styles,
        {
          ...containerProps,
          group: true,
          container: true,
          secondary,
          surface: !secondary,
          form,
          center,
          boxNoOverflow,
          hideOverflow,
          box,
          border,
        },
        className,
      )}
    />
  );
});
