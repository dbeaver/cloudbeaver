/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useStyles, composes } from '@cloudbeaver/core-theming';

const TextPlaceholderStyles = composes(
  css`
    span {
      composes: theme-typography--headline5 from global;
    }
  `,
  css`
    div {
      flex: 1;
      display: flex;
      width: 100%;
      height: 100%;
      min-width: 230px;
      margin: auto;
    }
    span {
      margin: auto;
      text-align: center;
    }
  `
);

export const TextPlaceholder: React.FC = function TextPlaceholder(props) {
  return styled(useStyles(TextPlaceholderStyles))(
    <div>
      <span>
        {props.children}
      </span>
    </div>
  );
};
