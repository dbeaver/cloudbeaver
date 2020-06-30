/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@cloudbeaver/core-theming';

export const InlineEditorStyles = composes(
  css`
  editor {
    composes: theme-border-color-background from global;
  }

  editor-actions {
    composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
  }

  editor-action {
    composes: theme-ripple from global;
  }

  input {
    composes: theme-text-text-primary-on-light from global;
  }
  `,
  css`
  editor {
    position: relative;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: 100%;
    border: solid 1px;
  }

  editor:focus-within {
    border-color: #01cca3;
  }

  editor-container {
    position: relative;
    height: 100%;
    flex: 1;

    & input {
      color: inherit;
      background: inherit;
      letter-spacing: inherit;
      outline: none;
      border: none;
      padding-left: 11px; /* because of left border */
      padding-right: 12px;
      padding-top: 1px; /* because of -1px top */
      line-height: 24px;
      width: 100%;
      height: 100%;
    }
  }
  
  editor-actions {
    position: absolute;
    top: -1px;
    left: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;

    border: solid 1px;
  }

  editor:focus-within {
    & editor-actions {
      border-top-color:  #01cca3;
      border-right-color: #01cca3;
      border-bottom-color: #01cca3;
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

  editor:focus-within {
    & editor-actions[|position=bottom],
    & editor-actions[|position=top] {
      border-left-color: #01cca3;
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
    box-sizing: border-box;
    display: flex;
    width: 24px;
    padding: 5px;
    cursor: pointer;

    & Icon {
      display: block;
      width: 100%;
    }

    &[use|disabled] {
      cursor: default;
      opacity: 0.65;

      &:before {
        display: none;
      }
    }
  }
`
);
