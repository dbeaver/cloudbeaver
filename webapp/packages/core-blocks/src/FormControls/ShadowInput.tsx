/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React from 'react';

type ShadowInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'children'> & {
  onChange?(value: string): any;
  children?: string;
  className?: string;
};

export const ShadowInput = React.forwardRef(function ShadowInput({
  onChange,
  children,
  ...rest
}: ShadowInputProps, ref: React.Ref<HTMLInputElement>) {
  return (
    <input
      value={children}
      onChange={e => onChange && onChange(e.target.value)}
      ref={ref}
      {...rest}/>
  );
});
