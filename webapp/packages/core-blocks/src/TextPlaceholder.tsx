/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

const TextPlaceholderStyles = css`
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
  `;

interface Props {
  className?: string;
}

export const TextPlaceholder: React.FC<React.PropsWithChildren<Props>> = function TextPlaceholder(props) {
  return styled(TextPlaceholderStyles)(
    <div>
      <span className={props.className}>
        {props.children}
      </span>
    </div>
  );
};
