/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const slideBoxStyles = css`
  SlideBox {
    overflow: hidden;
    white-space: nowrap;

    & SlideElement {
      width: 100%;
      height: 100%;
      display: inline-block;
      vertical-align:top;
      transition: transform cubic-bezier(0.4, 0.0, 0.2, 1) 0.6s;
      transform: translateX(-100%);
    }

    &[open] SlideElement {
      transform: translateX(0%);
    }
  }
`;
