/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DetailedHTMLProps, IframeHTMLAttributes } from 'react';
import styled, { css } from 'reshadow';

import { useStyles } from './useStyles';

const styles = css`
    iframe {
      composes: theme-border-color-background from global;
      border: 1px solid;
    }
  `;

export const Iframe: React.FC<DetailedHTMLProps<IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>> = function Iframe(props) {
  return styled(useStyles(styles))(
    <iframe {...props} />
  );
};
