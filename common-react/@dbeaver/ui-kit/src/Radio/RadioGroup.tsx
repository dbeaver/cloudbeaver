/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useId } from 'react';
import clsx from 'clsx';
import './RadioGroup.css';
import { _RadioGroup, _RadioProvider, type RadioProviderProps } from './index.js';

type LabelProps =
  | {
      labelledBy: string;
      label?: never;
      ['aria-label']?: never;
    }
  | {
      labelledBy?: never;
      label: React.ReactNode;
      ['aria-label']?: never;
    }
  | {
      labelledBy?: never;
      label?: never;
      ['aria-label']: string;
    };

type RadioGroupProps = Pick<RadioProviderProps, 'value' | 'setValue' | 'store' | 'setActiveId' | 'rtl' | 'defaultValue'> &
  LabelProps & {
    required?: boolean;
    className?: string;
    vertical?: boolean;
    children: React.ReactNode;
  };

export function RadioGroup({ className, children, labelledBy, label, ['aria-label']: ariaLabel, ...props }: RadioGroupProps) {
  const labelId = useId();
  const labelledById = label ? labelId : labelledBy;
  return (
    <_RadioProvider {...props}>
      <div className="dbv-kit-radio-group__container">
        {label && (
          <div id={labelId} className={clsx('dbv-kit-radio-group__label', props.required && 'dbv-kit-radio-group__label--required')}>
            {label}
          </div>
        )}
        <_RadioGroup
          aria-labelledby={labelledById}
          aria-label={ariaLabel}
          className={clsx('dbv-kit-radio-group', className, props.vertical && 'dbv-kit-radio-group--vertical')}
        >
          {children}
        </_RadioGroup>
      </div>
    </_RadioProvider>
  );
}
