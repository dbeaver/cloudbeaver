/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { StaticImage } from '@cloudbeaver/core-blocks';
import { composes, useStyles } from '@cloudbeaver/core-theming';

const styles = composes(
  css`
    status {
      composes: theme-background-positive theme-border-color-surface from global;
    }
  `,
  css`
    icon {
      position: relative;
    }
    status-container {
      position: absolute;
      bottom: 0;
      right: 0;
    }
    status {
      box-sizing: border-box;
      width: 8px;
      height: 8px;
      border-radius: 50%;      
      border: 1px solid;
    }
    StaticImage {
      height: 100%;
    }
`);

interface Props {
  connected: boolean;
  icon?: string;
  className?: string;
}

export const TreeNodeIcon: React.FC<Props> = function TreeNodeIcon({
  connected,
  icon,
  className,
}) {
  return styled(useStyles(styles))(
    <icon as="div" className={className}>
      <StaticImage icon={icon} />
      {connected && (
        <status-container as='div'>
          <status as='div' />
        </status-container>
      )}
    </icon>
  );
};
