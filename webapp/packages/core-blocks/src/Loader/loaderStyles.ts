/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

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

    & StaticImage {
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

  loader[|fullSize] {
    & icon {
      width: 100%;
      height: 100%;
    }
  }

  loader[|inline] {
    height: 38px;
    flex-direction: row;
    margin: 0;
    justify-content: left;
    
    & icon {
      width: 24px;
      height: 24px;
    }
    & message {
      padding: 0 16px;
    }
    & actions {
      padding: 0;
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
export const overlayStyles = css`
    loader {
      composes: theme-text-on-primary from global;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.4);
    }
  `;
