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
import style from './Container.module.css';
import { filterContainerFakeProps, getContainerProps } from './filterContainerFakeProps.js';
import type { IContainerProps } from './IContainerProps.js';
import elementsSizeStyle from './shared/ElementsSize.module.css';

interface Props {
  as?: 'div' | 'header' | 'footer' | 'section' | 'aside' | 'main' | 'nav';
}

export const Container = forwardRef<HTMLDivElement, Props & IContainerProps & React.HTMLAttributes<HTMLDivElement>>(function Container(
  { as = 'div', className, ...rest },
  ref,
) {
  const styles = useS(style, elementsSizeStyle);
  const divProps = filterContainerFakeProps(rest);
  const containerProps = getContainerProps(rest);
  const Element = as;

  return (
    <Element
      ref={ref}
      {...divProps}
      className={s(
        styles,
        {
          container: true,
          ...containerProps,
        },
        className,
      )}
    />
  );
});
