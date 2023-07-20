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
import coloredContainerStyles from './ColoredContainer.m.css';
import containerStyles from './Container.m.css';
import { filterContainerFakeProps, getContainerProps } from './filterContainerFakeProps';
import type { IContainerProps } from './IContainerProps';
import elementsSizeStyles from './shared/ElementsSize.m.css';

export const ColoredContainer = forwardRef<HTMLDivElement, IContainerProps & React.HTMLAttributes<HTMLDivElement>>(function ColoredContainer(
  { className, ...rest },
  ref,
) {
  const styles = useS(coloredContainerStyles, containerStyles, elementsSizeStyles);
  const divProps = filterContainerFakeProps(rest);
  const containerProps = getContainerProps(rest);

  return <div ref={ref} {...divProps} className={s(styles, { coloredContainer: true, container: true, ...containerProps }, className)} />;
});
