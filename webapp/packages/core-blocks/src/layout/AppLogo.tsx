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
    padding: 0 14px;
    cursor: pointer;
  }

  IconOrImage {
    height: 32px;
    width: 154px;
  }

  @media only screen and (min-width: 480px) {
    IconOrImage {
      content: url(/icons/logo_sm.svg);
      width: auto;
    }
  }
`;

interface Props {
  title: string;
  onClick?: () => void;
}

export const AppLogo: React.FC<Props> = function AppLogo({ title, onClick }) {
  return styled(styles)(
    <logo title={title} onClick={onClick}>
      <IconOrImage icon="/icons/logo.svg" />
    </logo>
  );
};
