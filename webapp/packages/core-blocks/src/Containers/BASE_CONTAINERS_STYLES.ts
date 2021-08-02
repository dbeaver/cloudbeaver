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
      composes: theme-background-surface theme-text-on-surface from global;
    }
    ColoredContainer {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    Container, ColoredContainer, Group {
      display: flex;
      flex-direction: row;
      align-content: baseline;
      position: relative;

      &[vertical] {
        flex-direction: column;
        align-content: stretch;

        & > :global(*) {
          flex-basis: 0 !important;
        }
      }

      &[baseline] {
        align-items: baseline;
      }

      &[center] {
        align-items: center;
        justify-content: center;
        align-content: center;
      }

      &[wrap] {
        flex-wrap: wrap;
      }

      &[overflow] {
        overflow: auto;
      }

      &[parent] {
        padding: 24px;
      }

      &[gap] {
        gap: 24px;
      }
    }

    Group {
      align-content: baseline;
      box-sizing: border-box;
      padding: 24px;
      border-radius: 4px;

      &[form] > :global(*) {
        margin-right: 25%;
      }

      &[box] {
        padding: 0;
        overflow: hidden;
      }

      &[center] {
        margin: 0 auto;
      }
    }

    Container, ColoredContainer, Group {
      flex-wrap: wrap;
      flex: 1 1 100%;

      & > :global(*) {
        flex: 1 1 100%;
      }

      &[keepSize], & > [keepSize] {
        flex-grow: 0;
        flex-basis: 0;
        flex-basis: auto; /* test for layout */
      }

      &[tiny], & > [tiny] {
        flex-basis: 140px;
        max-width: 210px;
      }

      &[small], & > [small] {
        flex-basis: 260px;
        max-width: 390px;
      }

      &[medium], & > [medium] {
        flex-basis: 460px;
        max-width: 640px;
      }

      &[large], & > [large] {
        flex-basis: 800px;
        max-width: 800px;
      }

      &[fill], & > [fill] {
        max-width: none;
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

    GroupClose {
      width: 18px;
      height: 18px;
      cursor: pointer;
      display: flex;
      position: absolute;
      right: 24px;
      margin-right: 0 !important;
    }
  `);
