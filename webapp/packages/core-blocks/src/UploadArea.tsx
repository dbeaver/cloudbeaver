/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useLayoutEffect } from 'react';

import { uuid } from '@cloudbeaver/core-utils';

import { s } from './s.js';
import style from './UploadArea.module.css';
import { useRefInherit } from './useRefInherit.js';
import { useS } from './useS.js';

interface Props extends Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'value'> {
  value?: FileList | null;
  className?: string;
  /** Reset prev file path. This ensures that the onChange event will be triggered for the same file as well */
  reset?: boolean;
}

export const UploadArea = observer(
  forwardRef<HTMLInputElement, Props>(function UploadArea({ id = uuid(), value, reset, children, className, ...rest }, refInherit) {
    const styles = useS(style);
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

    return (
      <>
        <input ref={ref} {...rest} type="file" id={id} hidden onChange={handleChange} />
        <label className={s(styles, { label: true, disabled: rest.disabled }, className)} htmlFor={id} title={rest.title}>
          {children}
        </label>
      </>
    );
  }),
);
