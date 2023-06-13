/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import styled, { css, use } from 'reshadow';

import { IconOrImage } from '../IconOrImage';

const styles = css`
  logo {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 8px;
    cursor: pointer;
  }

  IconOrImage {
    height: 24px;
    width: 120px;
    &[|small] {
      display: none;
    }
  }

  @media only screen and (min-width: 480px) {
    IconOrImage {
      &[|primary] {
        display: none;
      }
      &[|small] {
        display: block;
        width: auto;
      }
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
      <IconOrImage icon="/icons/logo.svg" {...use({ primary: true })} />
      <IconOrImage icon="/icons/logo_sm.svg" {...use({ small: true })} />
    </logo>,
  );
};
