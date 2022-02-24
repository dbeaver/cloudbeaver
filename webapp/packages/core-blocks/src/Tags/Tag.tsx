/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';

import { IconOrImage } from '../IconOrImage';

export interface ITag {
  id: string;
  label: string;
  icon?: string;
}

const style = composes(
  css`
    tag-container {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    tag-container {
      display: flex;
      align-items: center;
      padding: 4px 4px 4px 8px;
      border-radius: 4px;
      max-width: 150px;
      &::before {
        border-radius: 4px;
      }
    }
    tag-icon {
      display: flex;
      flex-shrink: 0;
      width: 16px;
      margin-right: 4px;
    }
    tag-content {
      composes: theme-typography--caption from global;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    tag-actions {
      position: relative;
      display: flex;
    }
    tag-action {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 12px;
      padding: 4px;
      cursor: pointer;
      flex-shrink: 0;
      &:hover {
        opacity: 0.7;
      }
    }
    IconOrImage {
      width: 100%;
      height: 100%;
    }
  `
);

interface Props extends ITag {
  onRemove: (id: string) => void;
  className?: string;
}

export const Tag = observer<Props>(function Tag({ id, label, icon, onRemove, className }) {
  const styles = useStyles(style);

  return styled(styles)(
    <tag-container as='li' title={label} className={className}>
      {icon && (
        <tag-icon>
          <IconOrImage icon={icon} />
        </tag-icon>
      )}
      <tag-content>{label}</tag-content>
      <tag-actions>
        <tag-action onClick={() => onRemove(id)}>
          <IconOrImage icon='cross' />
        </tag-action>
      </tag-actions>
    </tag-container>
  );
});