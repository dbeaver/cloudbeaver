/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { Icon } from '../Icon';

interface Props {
  className?: string;
  onClick?: () => void;
}

const styles = css`
    icon-btn {
      composes: theme-background-surface theme-text-on-surface theme-ripple from global;
      box-sizing: border-box;
      margin-left: 36px;
      width: 48px;
      height: 48px;
      padding: 16px;
      border-radius: 50%;
      display: none;
      overflow: hidden;
      align-items: center;
      transform: rotate(90deg);
    }
    Icon {
      width: 100%;
    }
  `;

export const SlideOverlay: React.FC<Props> = function SlideOverlay({
  className,
  onClick,
}) {
  return styled(useStyles(styles))(
    <div className={className} onClick={onClick}>
      <icon-btn>
        <Icon name="angle" viewBox="0 0 15 8" />
      </icon-btn>
    </div>
  );
};
