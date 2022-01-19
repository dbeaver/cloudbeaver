/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type React from 'react';
import styled, { css, use } from 'reshadow';

import { ENotificationType } from '@cloudbeaver/core-events';

import { NotificationMark } from './Snackbars/NotificationMark';

const style = css`
  container {
    width: 100%;
    height: 100%;
    display: flex;
    overflow: auto;

    &[|root] {
      height: 100vh;
    }
  }
  container-inner-block {
    display: flex;
    margin: auto;
    padding: 16px 24px;
    flex-direction: column;
    align-items: center;
  }
  NotificationMark {
    width: 40px;
    height: 40px;
  }
`;

interface IProps {
  root?: boolean;
}

export const DisplayError: React.FC<IProps> = function DisplayError({ root, children }) {
  return styled(style)(
    <container {...use({ root })}>
      <container-inner-block>
        <NotificationMark type={ENotificationType.Error} />
        <p>Something went wrong.</p>
        {children}
      </container-inner-block>
    </container>
  );
};
