/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@cloudbeaver/core-theming';

export const commonDialogStyle = composes(
  css`
  dialog {
    composes: theme-background-surface theme-text-on-surface from global;
  }
  dialog-body {
    composes: theme-background-secondary theme-text-on-secondary from global;
  }
  `,
  css`
  dialog {
    composes: theme-elevation-z10 from global;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 0;
    margin: 0;
    border: none;
    height: auto;
    min-width: 748px;
    max-height: 100%;
    border-radius: 0.25rem;
  }
  header {
    position: relative;
    display: flex;
    flex-direction: column;
  }
  header-title {
    display: flex;
    align-items: center;
    position: relative;
  }
  IconOrImage {
    width: 24px;
    height: 24px;
    padding: 18px 24px;
    padding-right: 0;
    margin-right: -8px;
  }
  dialog-body {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
    padding: 18px 24px;
    min-height: 80px;
    max-width: 748px;
  }
  dialog-body[|noPadding] {
    padding: 0;
  }
  h1 {
    display: block;
    flex: 1;
    padding: 18px 24px;
    margin: 0;
    font-size: 20px;
    line-height: 28px;
    font-weight: normal;
  }
  reject {
    cursor: pointer;
    margin: 24px;
    width: 16px;
    height: 16px;
  }
  footer {
    composes: theme-elevation-z10 from global;
    display: flex;
    z-index: 0;
    box-sizing: border-box;
    min-height: 72px;
    padding: 18px 24px;
  }
`
);
