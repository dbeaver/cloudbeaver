/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const baseFormControlStyles = css`
  field {
    display: flex;
    flex-wrap: wrap;
    flex: auto;
    box-sizing: border-box;
    align-items: center;
    padding: 12px;
    min-height: 54px;

    & input, 
    & textarea {
      flex: 1;
      min-height: 26px;
    }
  }

  field-label {
    composes: theme-typography--body1 from global;
    box-sizing: border-box;
    width: 180px;
    text-align: right;
    padding: 0 16px;
    line-height: 16px;
    font-weight: 500;
  }

  field-description {
    composes: theme-typography--caption from global;
    flex-basis: 100%;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 180px;
  }
  
  field[|raw] {
    & field-description {
      padding: 0;
    }
  }
  
  field[|long] {
    & field-label {
      width: 200px;
    }
    & field-description {
      padding-left: 200px;
    }
  }

  field[|short] {
    & field-label {
      width: auto;
    }
    & field-description {
      padding-left: auto;
    }
  }
  
  field-label + field-description {
    padding-left: 0!important;
    flex-basis: auto;
  }
`;
