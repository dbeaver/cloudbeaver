/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@cloudbeaver/core-theming';

export const BASE_CONTAINERS_STYLES = composes(
  css`
    Group {
      composes: theme-background-surface from global;
    }
    ColoredContainer {
      composes: theme-background-secondary from global;
    }
  `,
  css`
    Container, ColoredContainer {
      display: flex;
      flex-direction: column;
      &[horizontal] {
        flex-direction: row;
      }
      &[wrap] {
        flex-wrap: wrap;
      }
      &[overflow] {
        overflow: auto;
      }
      &[parent] {
        padding: 8px;
      }
    }

    Group {
      box-sizing: border-box;
      margin: 10px;
      padding: 10px;
      border-radius: 4px;
      &[form] {
        padding-right: 30%;
      }
    }

    GroupItem {
      padding: 12px;
      min-width: min-content;
    }

    Grid {
      display: grid;
      grid-template-columns: minmax(min-content, 1fr);
      grid-auto-rows: max-content; 
      &[horizontal] {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }
      &[center] {
        margin: 0 auto;
      }
    }

    Grid {
      & > [gridItemMax] {
        grid-column: 1/-1;
      }
      & > [gridItemMedium] {
        grid-column: 1/-2;
      }
    }

    GroupTitle {
      composes: theme-typography--body1 from global;
      font-weight: 400;
      padding-left: 12px;
      text-transform: uppercase;
      opacity: 0.9;
    }

    Container, ColoredContainer, Group, Grid {
      flex-grow: 1;
      &[small] {
        max-width: 250px;
      }
      &[medium] {
        max-width: 450px;
      }
      &[large] {
        max-width: 650px;
      }
    }      
  `);
