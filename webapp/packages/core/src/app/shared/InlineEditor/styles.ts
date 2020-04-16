/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@dbeaver/core/theming';

export const InlineEditorStyles = composes(
  css`
  editor-actions {
    composes: theme-background-surface theme-text-on-surface from global;
  }

  editor-action {
    composes: theme-ripple from global;
  }
  `,
  css`
  editor {
    position: relative;
    width: 100%;
    height: 100%;
    padding-left: 12px;
    padding-right: 12px;
    border: solid 1px #01cca3;
  }

  editor-container {
    position: relative;
    height: 100%;

    & input {
      color: inherit;
      background: inherit;
      border: none;
      font-size: 13px;
      line-height: 24px;
      font-weight: 700;
      width: 100%;
      height: 100%;
    }
  }
  
  editor-actions {
    position: absolute;
    top: -1px;
    left: 100%;
    height: auto;
    display: flex;
    flex-direction: row;

    border: solid 1px #01cca3;
    border-left-color: #dedede;
  }

  editor-actions[|position=bottom],
  editor-actions[|position=top] {
    right: -1px;
    left: auto;
    border-left-color: #01cca3;
  }

  editor-actions[|position=bottom] {
    top: auto;
  }

  editor-actions[|position=top] {
    bottom: 100%;
    top: auto;
  }

  editor-action {
    display: flex;
    width: 27px;
    padding: 5px;
    cursor: pointer;

    & Icon {
      display: block;
      width: 100%;
    }
  }
`
);
