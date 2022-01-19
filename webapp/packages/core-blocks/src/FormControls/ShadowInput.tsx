/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef } from 'react';

type ShadowInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'children'> & {
  onChange?: (value: string) => any;
  children?: string;
  className?: string;
};

export const ShadowInput = forwardRef<HTMLInputElement, ShadowInputProps>(function ShadowInput({
  onChange,
  children,
  ...rest
}, ref) {
  return (
    <input
      ref={ref}
      value={children ?? ''}
      onChange={e => onChange?.(e.target.value)}
      {...rest}
    />
  );
});
