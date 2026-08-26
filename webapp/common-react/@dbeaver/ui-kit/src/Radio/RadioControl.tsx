/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import clsx from 'clsx';
import './Radio.css';

export interface RadioControlProps {
  checked?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RadioControl({ checked, disabled, className }: RadioControlProps): React.ReactElement {
  return <span className={clsx('dbv-kit-radio__control', className)} data-checked={checked} data-disabled={disabled || undefined} />;
}
