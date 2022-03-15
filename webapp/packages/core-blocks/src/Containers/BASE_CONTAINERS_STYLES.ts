/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const BASE_CONTAINERS_STYLES = css`
    Group {
      composes: theme-background-surface theme-text-on-surface from global;
    }
    ColoredContainer {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
    GroupSubTitle {
      composes: theme-text-text-hint-on-light from global;
    }
    Container, ColoredContainer, Group {
      display: flex;
      flex-direction: row;
      align-content: baseline;
      position: relative;

      &[hideEmpty]:empty {
        display: none;
      }

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

      &[flexStart]{
        align-items: flex-start;
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

        &[dense] {
          padding: 8px;
        }
      }

      &[gap] {
        gap: 24px;

        &[dense] {
          gap: 8px;
        }
      }
    }

    Group {
      align-content: baseline;
      box-sizing: border-box;
      padding: 24px;
      border-radius: 4px;

      &[dense] {
        padding: 8px;
      }

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
      &[grid] {
        display: grid;
      }

      /* increase css specificity */
      &[grid]:nth-child(n) {
        flex-basis: unset;
        max-width: unset;
      }

      &[grid][tiny] {
        grid-template-columns: repeat(auto-fit, minmax(140px, max-content));
      }

      &[grid][small] {
        grid-template-columns: repeat(auto-fit, minmax(260px, max-content));
      }

      &[grid][medium] {
          grid-template-columns: repeat(auto-fit, minmax(460px, max-content));
      }

      &[grid][large] {
        grid-template-columns: repeat(auto-fit, minmax(800px, max-content));
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

      &[tiny], & > [tiny], &[grid][tiny] > * {
        flex-basis: 140px;
        max-width: 210px;
      }

      &[small], & > [small], &[grid][small] > * {
        flex-basis: 260px;
        max-width: 390px;
      }

      &[medium], & > [medium], &[grid][medium] > * {
        flex-basis: 460px;
        max-width: 640px;
      }

      &[large], & > [large], &[grid][large] > * {
        flex-basis: 800px;
        max-width: 800px;
      }

      &[maximum], & > [maximum], &[grid][maximum] > * {
        max-width: 100%;
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

    Group[box] GroupTitle {
      padding: 24px;
    }

    GroupSubTitle {
      composes: theme-typography--caption from global;
      display: block;
      text-transform: none;
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
  `;
