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
      flex-basis: 0;
      align-content: baseline;

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
        padding: 10px;
      }

      &[gap] {
        gap: 24px;
      }

      & > * {
        flex-grow: 1;
      }

      & > [flexItemKeepSize] {
        flex-grow: 0;
      }

      & > [flexItemTiny] {
        flex-basis: 100px;
      }

      & > [flexItemSmall] {
        flex-basis: 240px;
      }

      & > [flexItemMedium] {
        flex-basis: 340px;
      }

      & > [flexItemLarge] {
        flex-basis: 540px;
      }
    }

    Grid, Group {
      display: grid;
      grid-gap: 24px;
      align-content: baseline;
      grid-template-columns: minmax(min-content, 1fr);
      grid-auto-rows: max-content;

      &[noGap] {
        grid-gap: 0;
      }

      &[horizontal] {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      &[center] {
        margin: 0 auto;
      }

      & > [gridItemMax] {
        grid-column: 1/-1;
      }
    }

    Group {
      box-sizing: border-box;
      margin: 10px;
      padding: 24px;
      border-radius: 4px;

      &[form] {
        padding-right: 30%;
      }
    }

    Container, ColoredContainer, Group, Grid {
      flex-grow: 1;

      &[keepSize] {
        flex-grow: 0;
      }

      &[limitWidth] {
        max-width: 800px;
      }

      &[small], & > [small] {
        max-width: 250px;
      }

      &[medium], & > [medium] {
        max-width: 450px;
      }

      &[large], & > [large] {
        max-width: 650px;
      }
    }

    GroupItem {
      min-width: min-content;
    }

    GroupTitle {
      composes: theme-typography--body2 from global;
      font-weight: 400;
      margin: 0;
      text-transform: uppercase;
      opacity: 0.9;
    }  
  `);
