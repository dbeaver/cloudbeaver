/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const BASE_TAB_STYLES = css`
placeholder {
  composes: placeholder from global;
}
BaseTab {
  position: relative;
  outline: none;
  font-weight: normal;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;

  height: 48px;
  border-top: solid 2px transparent;

  &:global([aria-selected="true"]) {
    font-weight: 500;
    cursor: auto;
    border-top-color: var(--theme-negative);
    opacity: 1;

    &:before {
      display: none;
    }
  }

  &:not(:global([aria-selected="true"])) {
    background-color: transparent !important;
  }
}

tab-inner {
  composes: theme-typography--body2 tab from global;
  display: grid;
  position: relative;
}

tab-inner[|selected] portal,
tab-inner portal[|menuOpened],
tab-inner:hover portal,
tab-inner:focus-within portal {
  visibility: visible;
}

tab-container {
  max-width: 240px;
  height: 100%;
  display: flex;
  flex-shrink: 0;
  text-align: left;
  align-items: center;

  & tab-icon {
    height: 24px;
    padding-left: 12px;

    & StaticImage,
    & IconOrImage,
    & img {
      width: 24px;
    }

    & placeholder {
      width: 24px;
      height: 24px;
    }
  }

  & tab-title {
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 12px;
  }

  & tab-title placeholder {
    width: 80px;
    height: 16px;
  }
}

TabList {
  box-sizing: border-box;
}

TabPanel {
  flex: 1;
  display: flex;
  overflow: hidden;
  outline: none;
  position: relative;
}
`;

export const BASE_TAB_ACTION_STYLES = css`
  tab-actions {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    overflow: hidden;

    &:not(:empty) + BaseTab {
      padding-right: 14px;
    }

    &:empty {
      display: none;
    }
  }

  tab-action {
    position: relative;
    height: 8px;
    width: 8px;
    align-self: flex-start;
    flex-shrink: 0;
    padding: 4px;
    padding-left: 0;

    &:hover {
      opacity: 0.8;
    }

    &:before {
      content: "";
      display: block;
      left: -4px;
      top: 0;
      height: 16px;
      width: 16px;
      position: absolute;
      cursor: pointer;
    }

    & Icon {
      display: block;
    }
  }

  portal {
    visibility: hidden;
    & tab-action {
      width: 10px;
      height: 10px;
    }
  }
`;
