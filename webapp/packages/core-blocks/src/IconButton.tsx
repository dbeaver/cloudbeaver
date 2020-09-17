/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Button, ButtonProps } from 'reakit/Button';
import styled, { css } from 'reshadow';

import { Icon } from './Icons/Icon';

const styles = css`
  Button {
    color: inherit;
    outline: none;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    margin: 4px;
    height: 16px;
    width: 16px;

    & Icon {
      width: 100%;
      height: 100%;
    }
  }
`;

type Props = {
  name: string;
  viewBox?: string;
}

export function IconButton({ name, viewBox, ...rest }: Props & ButtonProps) {
  return styled(styles)(
    <Button {...rest}>
      <Icon name={name} viewBox={viewBox} />
    </Button>
  );
}
