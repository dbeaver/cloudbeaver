/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef } from 'react';

import type { IContainerProps } from './IContainerProps';

export const ColoredContainer = forwardRef<HTMLDivElement, IContainerProps>(function ColoredContainer({ children, ...rest }, ref) {
  return (
    <div {...rest} ref={ref}>
      {children}
    </div>
  );
});
