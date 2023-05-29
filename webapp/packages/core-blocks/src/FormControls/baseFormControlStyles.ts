/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { css } from 'reshadow';

export const baseFormControlStyles = css`
  field {
    box-sizing: border-box;
    max-width: 100%;

    &[|small] {
      max-width: 250px;
    }
    &[|medium] {
      max-width: 450px;
    }
    &[|large] {
      max-width: 650px;
    }

    & field {
      height: 32px;
      padding: 0;
    }
  }

  field-label {
    composes: theme-typography--body1 from global;
    box-sizing: border-box;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  field-description {
    composes: theme-typography--caption from global;
    box-sizing: border-box;
    padding-top: 4px;
    min-height: 24px;
  }

  input,
  textarea {
    font-size: 12px;

    &[|select] {
      cursor: pointer;
      user-select: none;
    }
  }
`;

export const baseValidFormControlStyles = css`
  field-description {
    composes: theme-text-text-hint-on-light from global;
  }
`;

export const baseInvalidFormControlStyles = css`
  field-description {
    composes: theme-text-negative from global;
  }
`;
