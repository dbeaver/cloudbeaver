/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
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

interface Props extends IContainerProps, React.HTMLAttributes<HTMLDivElement> {
  surface?: boolean;
}

export const ColoredContainer = forwardRef<HTMLDivElement, Props>(function ColoredContainer({ className, surface, ...rest }, ref) {
  const styles = useS(coloredContainerStyles, containerStyles, elementsSizeStyles);
  const divProps = filterContainerFakeProps(rest);
  const containerProps = getContainerProps(rest);

  return <div ref={ref} {...divProps} className={s(styles, { surface, secondary: !surface, container: true, ...containerProps }, className)} />;
});
