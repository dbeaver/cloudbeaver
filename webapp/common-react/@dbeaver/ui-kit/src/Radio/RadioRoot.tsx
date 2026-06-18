/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import type { ControlSize } from '../types/controls.js';
import './Radio.css';

interface Props {
  size?: ControlSize;
}

export type RadioRootProps<T extends ElementType = 'span'> = Props & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof Props | 'as'>;

export function RadioRoot<T extends ElementType = 'span'>({ as, size = 'medium', className, ...props }: RadioRootProps<T>): React.ReactElement {
  const Component: ElementType = as ?? 'span';
  return <Component className={clsx('dbv-kit-radio', `dbv-kit-radio--${size}`, className)} {...props} />;
}
