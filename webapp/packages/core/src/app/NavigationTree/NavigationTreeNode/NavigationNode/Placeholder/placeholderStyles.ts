/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const placeholderStyles = css`
  box {
    position: relative;
    overflow: hidden;
    padding: 0 6px;
    max-width: 200px;
  }

  div {
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
    height: 18px;
    background: #dedede;
    border-radius: 3px;
    margin: 2px 0px;
    animation: wave 1.5s linear infinite;
  }

  @keyframes wave {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
`;
