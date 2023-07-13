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
import style from './Container.m.css';
import { filterContainerFakeProps } from './filterContainerFakeProps';
import type { IContainerProps } from './IContainerProps';
import elementsSizeStyle from './shared/ElementsSize.m.css';

export const Container = forwardRef<HTMLDivElement, IContainerProps & React.HTMLAttributes<HTMLDivElement>>(function Container(
  { className, ...rest },
  ref,
) {
  const styles = useS(style, elementsSizeStyle);
  const divProps = filterContainerFakeProps(rest);

  return (
    <div
      ref={ref}
      {...divProps}
      className={s(
        styles,
        {
          container: true,
          ...(rest as IContainerProps),
        },
        className,
      )}
    />
  );
});
