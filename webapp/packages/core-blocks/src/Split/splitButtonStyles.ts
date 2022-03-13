/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const buttonStyles = css`
    container {
      position: absolute;
      display: flex;
      justify-content: center;
      align-content: center;

      /* pointer outline */
      &::before {
        content: '';
        position: absolute;
        background: transparent;
      }
    }

    button {
      composes: theme-button theme-button_unelevated theme-button_background from global;
      opacity: 0;
      transition-property: opacity, box-shadow !important;
    }

    ripple {
      composes: theme-button_ripple from global;
    }

    container:hover button {
      opacity: 1;
    }

    container[|split='vertical'] {
      flex-direction: column;
      cursor: col-resize;
      height: 100%;
      width: 16px;
      left: -7px;

      &[|mode=minimize] {
        left: -4px;
      }

      &[|mode=maximize] {
        left: -12px;
      }

      & button {
        margin: 8px 0;
        min-width: 16px;

        &::after {
          transform: rotate(180deg);
        }
      }

      &[|mode=maximize] button,
      &[|mode=minimize] button {
        min-height: 64px;
      }

      & button[|isPrimary]::after {
        transform: rotate(0deg);
      }
    }
    container[|split='vertical'][|inverse] {
      flex-direction: column-reverse;
    }

    container[|split='horizontal'] {
      flex-direction: row;
      cursor: row-resize;
      width: 100%;
      height: 16px;
      top: -7px;

      &[|mode=minimize] {
        top: -4px;
      }

      &[|mode=maximize] {
        top: -12px;
      }

      & button {
        margin: 0 8px;
        min-width: 28px;
        height: 16px;

        &::after {
          transform: rotate(270deg);
        }
      }

      &[|mode=maximize] button,
      &[|mode=minimize] button {
        min-width: 64px;
      }

      & button[|isPrimary]::after {
        transform: rotate(90deg);
      }
    }
    container[|split='horizontal'][|inverse] {
      flex-direction: row-reverse;
    }
    button {
      padding: 0 !important;
      &::after {
        position: absolute;
        top: 50%;
        left: 50%;
        content: '';
        display: block;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 3px 4px 3px 0;
        border-color: transparent #000 transparent transparent;
        margin: -3px -2px;
      }
    }
  `;
