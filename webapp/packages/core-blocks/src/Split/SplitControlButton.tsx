/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import './SplitControlButton.css';
import { type ButtonProps, Button } from '../Button.js';
import { clsx } from '@dbeaver/ui-kit';

interface Props extends ButtonProps {
  mode: 'maximize' | 'minimize' | 'resize';
  split: 'horizontal' | 'vertical';
  inverse?: boolean;
}

export function SplitControlButton({ className, inverse = false, ...props }: Props): React.ReactElement {
  return (
    <Button
      {...props}
      className={clsx('split-button', `split-button--${props.mode}`, `split-button--${props.split}`, inverse && 'split-button--inverse', className)}
      type="button"
    />
  );
}
