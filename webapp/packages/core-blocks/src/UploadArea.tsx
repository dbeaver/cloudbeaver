/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { forwardRef, useLayoutEffect } from 'react';
import styled, { css, use } from 'reshadow';

import { uuid } from '@cloudbeaver/core-utils';

import { useRefInherit } from './useRefInherit';

interface Props extends Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'value'> {
  value?: FileList | null;
  className?: string;
  /** Reset prev file path. This ensures that the onChange event will be triggered for the same file as well */
  reset?: boolean;
}

const styles = css`
  label {
    cursor: pointer;
    width: fit-content;

    &[|disabled] {
      cursor: default;
    }
  }
`;

export const UploadArea = forwardRef<HTMLInputElement, Props>(function UploadArea(
  { id = uuid(), value, reset, children, className, ...rest },
  refInherit,
) {
  const ref = useRefInherit<HTMLInputElement>(refInherit);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (rest.onChange) {
      await (rest.onChange(event) as void | Promise<void>);

      if (reset) {
        const target = event.target as HTMLInputElement;
        target.value = '';
      }
    }
  };

  useLayoutEffect(() => {
    if (ref.current && value !== undefined) {
      ref.current.files = value;
    }
  });

  return styled(styles)(
    <>
      <input ref={ref} {...rest} type="file" id={id} hidden onChange={handleChange} />
      <label htmlFor={id} {...use({ disabled: rest.disabled })} className={className} title={rest.title}>
        {children}
      </label>
    </>,
  );
});
