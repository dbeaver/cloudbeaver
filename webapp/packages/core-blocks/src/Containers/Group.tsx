/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef } from 'react';
import styled, { css } from 'reshadow';

import { Icon } from '../Icon';
import { filterContainerFakeProps } from './filterContainerFakeProps';
import type { IContainerProps } from './IContainerProps';

interface Props extends IContainerProps {
  form?: boolean;
  center?: boolean;
  box?: boolean;
  onClose?: () => void;
}

const style = css`
  close {
    width: 18px;
    height: 18px;
    cursor: pointer;
    display: flex;
    position: absolute;
    right: 24px;
    margin-right: 0 !important;
  }
`;

export const Group = forwardRef<HTMLDivElement, Props & React.HTMLAttributes<HTMLDivElement>>(function Group({
  form,
  center,
  box,
  children,
  onClose,
  ...rest
}, ref) {
  const divProps = filterContainerFakeProps(rest);

  return styled(style)(
    <div ref={ref} {...divProps}>
      {onClose && <close><Icon name="cross" viewBox="0 0 16 16" onClick={onClose} /></close>}
      {children}
    </div>
  );
});
