/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';



const styles = css`
    status {
      composes: theme-background-positive from global;
      position: absolute;
      opacity: 0;
      transition: opacity 0.3s ease;
      bottom: 0;
      right: 0;
      box-sizing: border-box;
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &[|connected] {
        opacity: 1;
      }
    }
`;

interface Props {
  connected: boolean;
  className?: string;
}

export const ConnectionMark: React.FC<Props> = function ConnectionMark({ connected, className }) {
  return styled(styles)(
    <status {...use({ connected })} className={className} />
  );
};