/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';
import ReactDOM from 'react-dom';
import styled, { css } from 'reshadow';

import { useAppLoadingScreen } from '@cloudbeaver/core-blocks';

interface IRefreshProps {
  className?: string;
}

const ERROR_PAGE_STYLES = css`
  container {
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  container-inner-block {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  Refresh {
    color: white;
    font-weight: 500;
    background-color: #2a7cb4;
    padding: 5px 16px;
    border-radius: 4px;
    letter-spacing: .08929em;
    font-size: .875rem;
    text-transform: uppercase;
    cursor: pointer;
    outline: none;
    border: none;
    &:hover, &:focus {
      opacity: 0.8;
    }
    &:active {
      opacity: 0.5;
    }
  }
`;

function Refresh({ className }: IRefreshProps) {
  useAppLoadingScreen();

  const handleRefresh = useCallback(() => window.location.reload(), []);
  return <button className={className} onClick={handleRefresh}>Refresh</button>;
}

export function showErrorPage() {
  ReactDOM.render(styled(ERROR_PAGE_STYLES)(
    <container as='div'>
      <container-inner-block as='div'>
        <p>Error occurred while loading the page</p>
        <Refresh />
      </container-inner-block>
    </container>),
  document.getElementById('root')
  );
}
