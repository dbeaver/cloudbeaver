/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@cloudbeaver/core-theming';

export const loaderStyles = css`
  loader {
    margin: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    animation: rotation 2s infinite linear;

    & img {
      width: 100%;
    }
  }

  message {
    padding: 16px;
  }

  actions {
    padding-top: 42px;
  }

  loader[|small] {
    & icon {
      width: 16px;
      height: 16px;
    }
    & message {
      display: none;
    }
  }

  @keyframes rotation {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(359deg);
    }
  }
`;
export const overlayStyles = composes(
  css`
    loader {
      composes: theme-text-on-primary from global;
    }
  `,
  css`
    loader {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.4);
    }
  `
);
