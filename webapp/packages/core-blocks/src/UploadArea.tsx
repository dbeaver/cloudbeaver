/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { uuid } from '@cloudbeaver/core-utils';

interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  className?: string;
  /** Reset prev file path. This ensures that the onChange event will be triggered for the same file as well */
  reset?: boolean;
}

const styles = css`
  label {
    cursor: pointer;
  }
`;

export const UploadArea: React.FC<Props> = function UploadArea({ id, reset, className, children, ...rest }) {
  const _id = id ?? uuid();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (rest.onChange) {
      await (rest.onChange(event) as void | Promise<void>);

      if (reset) {
        const target = event.target as HTMLInputElement;
        target.value = '';
      }
    }
  };

  return styled(styles)(
    <>
      <input {...rest} type='file' id={_id} hidden onChange={handleChange} />
      <label htmlFor={_id} className={className} title={rest.title}>
        {children}
      </label>
    </>
  );
};
