/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { forwardRef } from 'react';

import { s } from '../s';
import { useS } from '../useS';
import containerStyles from './Container.m.css';
import { filterContainerFakeProps } from './filterContainerFakeProps';
import style from './Group.m.css';
import type { IContainerProps } from './IContainerProps';
import elementsSizeStyles from './shared/ElementsSize.m.css';

interface Props extends IContainerProps {
  form?: boolean;
  center?: boolean;
  box?: boolean;
  boxNoOverflow?: boolean;
}

export const Group = forwardRef<HTMLDivElement, Props & React.HTMLAttributes<HTMLDivElement>>(function Group(
  { form, center, box, boxNoOverflow, className, ...rest },
  ref,
) {
  const styles = useS(style, containerStyles, elementsSizeStyles);
  const divProps = filterContainerFakeProps(rest);

  return (
    <div
      ref={ref}
      {...divProps}
      className={s(
        styles,
        {
          group: true,
          container: true,
          form,
          center,
          boxNoOverflow,
          box,
          ...(rest as IContainerProps),
        },
        className,
      )}
    />
  );
});
