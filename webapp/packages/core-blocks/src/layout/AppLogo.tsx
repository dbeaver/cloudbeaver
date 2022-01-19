/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { IconOrImage } from '../IconOrImage';

const styles = css`
  logo {
    height: 100%;
    display: flex;
    align-items: center;
    margin-right: 16px;
    width: 250px;
    cursor: pointer;
  }

  IconOrImage {
    height: 34px;
    width: 154px;
    margin-bottom: 2px;
  }
`;

interface Props {
  title: string;
  onClick?: () => void;
}

export const AppLogo: React.FC<Props> = function AppLogo({ title, onClick }) {
  return styled(styles)(
    <logo as="div" title={title} onClick={onClick}>
      <IconOrImage icon="/icons/logo.svg" />
    </logo>
  );
};
