/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useId } from 'react';
import './RadioGroup.css';
import { _RadioGroup, _RadioProvider, Radio, type RadioProviderProps } from './index.js';
import type { ControlSize } from '../types/controls.js';

type ConditionalRadioProps =
  | {
      items: Array<{ value: string; label: string }>;
      name: string;
      size?: ControlSize;
      children?: never;
    }
  | {
      items?: never;
      name?: never;
      size?: never;
      children: React.ReactNode;
    };

type LabelProps =
  | {
      labelledBy?: string;
      label?: never;
    }
  | {
      labelledBy?: never;
      label?: React.ReactNode;
    };

type RadioGroupProps = Pick<RadioProviderProps, 'value' | 'setValue' | 'store' | 'setActiveId' | 'rtl' | 'defaultValue'> &
  ConditionalRadioProps &
  LabelProps & {
    required?: boolean;
    className?: string;
    vertical?: boolean;
  };

export function RadioGroup({ className, children, items, labelledBy, label, size = 'medium', name, ...props }: RadioGroupProps) {
  const labelId = useId();
  const labelledById = label ? labelId : labelledBy;
  return (
    <_RadioProvider {...props}>
      <div>
        {label && (
          <label id={labelId} className={`dbv-kit-radio-group__label ${props.required ? 'dbv-kit-radio-group__label--required' : ''}`}>
            {label}
          </label>
        )}
        <_RadioGroup
          aria-labelledby={labelledById}
          className={`dbv-kit-radio-group ${className ?? ''} ${props.vertical ? 'dbv-kit-radio-group--vertical' : ''}`}
        >
          {items
            ? items.map(option => (
                <Radio key={option.value} name={name} size={size} value={option.value}>
                  {option.label}
                </Radio>
              ))
            : children}
        </_RadioGroup>
      </div>
    </_RadioProvider>
  );
}
