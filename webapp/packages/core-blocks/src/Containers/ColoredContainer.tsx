/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef } from 'react';

import type { IContainerProps } from './IContainerProps';

export const ColoredContainer = forwardRef<HTMLDivElement, IContainerProps>(function ColoredContainer({ children, className }, ref) {
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
});
