/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

import { Icon } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

interface Props {
  expanded: boolean;
  onClick: (event: React.MouseEvent<any, MouseEvent>) => void;
  className?: string;
}

const styles = css`
    Icon {
      composes: theme-text-on-surface from global;
      width: 100%;
      height: 100%;
      cursor: pointer;
      opacity: 0.5;
      transform: rotate(-90deg);
      transition: transform 0.15s ease-in-out;
      &[|expanded] {
        transform: rotate(0deg);
      }
    }
  `;

export const Expand: React.FC<Props> = function Expand({ expanded, onClick, className }) {
  return styled(useStyles(styles))(
    <Icon
      className={className}
      name='arrow'
      viewBox='0 0 16 16'
      onClick={onClick}
      {...use({ expanded })}
    />
  );
};
