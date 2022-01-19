/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef } from 'react';

import { filterContainerFakeProps } from './filterContainerFakeProps';
import type { IContainerProps } from './IContainerProps';

export const ColoredContainer = forwardRef<HTMLDivElement, IContainerProps & React.HTMLAttributes<HTMLDivElement>>(function ColoredContainer(props, ref) {
  const divProps = filterContainerFakeProps(props);

  return <div ref={ref} {...divProps} />;
});
