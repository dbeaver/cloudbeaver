/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { Icon } from '../Icons/Icon';

const styles = css`
  logo {
    height: 100%;
    display: flex;
    align-items: center;
    margin-right: 16px;
    width: 250px;
    cursor: pointer;
  }

  Icon {
    height: 24px;
    width: auto;
    margin-bottom: 2px;
  }
`;

type Props = {
  title: string;
  onClick?: () => void;
}

export function AppLogo({ title, onClick }: Props) {
  return styled(styles)(
    <logo as="div" title={title} onClick={onClick}>
      <Icon name="logo" viewBox="0 0 361 73" />
    </logo>
  );
}
