/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ControlSize } from '../types/controls.js';
import { _Radio, type RadioProps as _RadioProps } from './index.js';
import { RadioControl } from './RadioControl.js';
import { RadioLabel } from './RadioLabel.js';
import { RadioRoot } from './RadioRoot.js';
import './Radio.css';

export interface RadioProps extends Omit<_RadioProps, 'size'> {
  size?: ControlSize;
}

export function Radio({ children, className, size = 'medium', ...props }: RadioProps): React.ReactElement {
  return (
    <RadioRoot as="label" title={props.title} size={size} className={className}>
      <_Radio className="dbv-kit-radio__input" {...props} />
      <RadioControl />
      <RadioLabel>{children}</RadioLabel>
    </RadioRoot>
  );
}

Radio.Root = RadioRoot;
Radio.Control = RadioControl;
Radio.Label = RadioLabel;
