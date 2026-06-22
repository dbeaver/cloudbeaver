/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import clsx from 'clsx';
import './Radio.css';

export interface RadioLabelProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function RadioLabel({ className, children, ...props }: RadioLabelProps): React.ReactElement {
  return (
    <span className={clsx('dbv-kit-radio__title', className)} {...props}>
      {children}
    </span>
  );
}
