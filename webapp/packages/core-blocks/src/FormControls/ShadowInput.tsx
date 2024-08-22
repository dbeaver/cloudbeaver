/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { forwardRef, useRef } from 'react';

import { useCombinedRef } from '../useCombinedRef';
import { useValidationStyles } from '../useValidationStyles';

type ShadowInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'children'> & {
  onChange?: (value: string) => any;
  children?: string;
  className?: string;
};

export const ShadowInput = forwardRef<HTMLInputElement, ShadowInputProps>(function ShadowInput({ onChange, children, ...rest }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useCombinedRef(inputRef, ref);

  useValidationStyles(inputRef);

  return <input ref={mergedRef} value={children ?? ''} onChange={e => onChange?.(e.target.value)} {...rest} />;
});
