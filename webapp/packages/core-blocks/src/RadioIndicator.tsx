/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { RadioRoot, RadioControl, type ControlSize } from '@dbeaver/ui-kit';
import './FormControls/Radio.css';

interface Props {
  checked?: boolean;
  disabled?: boolean;
  size?: ControlSize;
  className?: string;
}

export function RadioIndicator({ checked, disabled, size = 'medium', className }: Props): React.ReactElement {
  return (
    <RadioRoot size={size} className={className}>
      <RadioControl checked={checked} disabled={disabled} />
    </RadioRoot>
  );
}
