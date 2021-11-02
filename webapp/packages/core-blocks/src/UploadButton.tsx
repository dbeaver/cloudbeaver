/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { uuid } from '@cloudbeaver/core-utils';

interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  className?: string;
}

const styles = css`
  label {
    cursor: pointer;
  }
`;

export const UploadButton: React.FC<Props> = function UploadButton({ id, className, children, ...rest }) {
  const _id = id ?? uuid();

  return styled(styles)(
    <>
      <input {...rest} type='file' id={_id} hidden />
      <label htmlFor={_id} className={className} title={rest.title}>
        {children}
      </label>
    </>
  );
};
