/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const BASE_TABLE_STYLES = css`
  table {
    composes: theme-typography--body2 from global;
    min-width: 100%;
    text-align: left;
    border-collapse: collapse;
    border-color: var(--theme-background);
    table-layout: fixed;

    &[|size="big"] {
      & > thead > tr > th {
        height: 54px;

        &[|min] {
          width: 46px;
        }
      }

      & > tbody > tr > td {
        height: 46px;
      }
    }

    &[|expanded] {
      & > tbody > tr:not([|expanded]) {
        opacity: 0.85;
      }
    }
  }

tr {
  outline: none;
  border-bottom: 1px solid;
  border-color: var(--theme-background)!important;
}

tbody > tr {
  &:last-child {
    border-bottom: none;
  }

  &:focus {
    border-color: var(--theme-background);
  }

  &:not([|noHover]):hover,
  &:not([|noHover])[|selected],
  &:not([|noHover])[|expanded] {
    background-color: var(--theme-secondary);
  }

  &[|disabled] {
    opacity: 0.85;
  }
}

th {
  box-sizing: border-box;
  white-space: nowrap;
  padding: 16px;
  height: 36px;
  padding-top: unset;
  padding-bottom: unset;
  border-color: var(--theme-background);
  text-transform: uppercase;
  text-align: left;
  text-decoration: none !important;

  &[|min] {
    width: 28px;
  }

  &[|centerContent] > th-flex {
    align-items: center;
    justify-content: center;
  }

  &> th-flex {
    display: flex;
  }

  &:last-child {
    border-right: none;
  }
}

td {
  position: relative;
  box-sizing: border-box;
  height: 28px;
  padding: 0 16px;
  transition: padding ease-in-out 0.24s;

  &[|ellipsis] {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &[|centerContent] > td-flex {
    align-items: center;
    justify-content: center;
  }

  & > td-flex {
    display: flex;
  }

  &[|expandArea] {
    padding: 0;
  }

  & > input[type="checkbox"] {
    display: block;
    height: 16px;
    width: 16px;
  }
}

table-item-expand-box {
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 16px;
  height: 100%;
  padding: 0;

  & > Icon {
    width: 16px;
    height: 16px;
    padding: 0;

    &[use|expanded] {
      transform: rotate(180deg);
    }
  }
}
`;