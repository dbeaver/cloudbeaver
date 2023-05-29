/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { forwardRef } from 'react';

interface Props extends React.PropsWithChildren {
  expanded?: boolean;
  root?: boolean;
  className?: string;
}

export const TreeNodeNested = forwardRef<HTMLDivElement, Props>(function TreeNodeNested({ className, children }, ref) {
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
});
