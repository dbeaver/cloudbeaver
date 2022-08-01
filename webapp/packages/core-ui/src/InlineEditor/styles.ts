/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const InlineEditorStyles = css`
  input {
    composes: theme-text-text-primary-on-light from global;
  }

  editor {
    composes: theme-border-color-background from global;
    position: relative;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: 100%;
    border: solid 1px;
  }

  editor:focus-within, editor[|active] {
    border-color: #52c41a !important;
  }

  editor-container {
    position: relative;
    height: 100%;
    flex: 1;
    display: flex;

    & input, & input[disabled], & input[readonly] {
      border: none;
      border-radius: unset;
      width: 100%;
      height: 100%;
      min-height: unset;
      padding: 0 8px;
    }
  }
  
  editor-actions {
    composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
    position: absolute;
    top: -1px;
    left: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    border: solid 1px;

    &:empty {
      display: none;
    }
  }

  editor:focus-within, editor[|active] {
    & editor-actions {
      border-top-color:  #52c41a !important;
      border-right-color: #52c41a !important;
      border-bottom-color: #52c41a !important;
    }
  }

  editor-actions[|position=inside] {
    position: relative;
    flex: 0 0 auto;
    bottom: auto;
    left: auto;
    border-right: none !important;
  }

  editor-actions[|position=bottom],
  editor-actions[|position=top] {
    right: -1px;
    left: auto;
  }

  editor:focus-within, editor[|active] {
    & editor-actions[|position=bottom],
    & editor-actions[|position=top] {
      border-left-color: #52c41a !important;
    }
  }

  editor-actions[|position=bottom] {
    top: 100%;
  }

  editor-actions[|position=top] {
    bottom: 100%;
    top: auto;
  }

  editor-action {
    composes: theme-ripple from global;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 24px;
    padding: 4px;
    cursor: pointer;
    background: transparent;

    & Loader {
      width: 100%;
      height: 100%;
    }

    & IconOrImage {
      display: block;
      width: 100%;
    }

    & Icon {
      width: 100%;
    }

    &[disabled]::before {
      display: none;
    }
  }
`;
