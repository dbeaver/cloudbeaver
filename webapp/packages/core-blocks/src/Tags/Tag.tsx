/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { IconOrImage } from '../IconOrImage';

export interface ITag<T extends string | number = string> {
  id: T;
  label: string;
  icon?: string;
}

const style = css`
  tag-container {
    composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    display: flex;
    align-items: center;
    padding: 4px 4px 4px 8px;
    border-radius: var(--theme-form-element-radius);
    max-width: 150px;
    &::before {
      border-radius: var(--theme-form-element-radius);
    }
  }
  tag-icon {
    display: flex;
    flex-shrink: 0;
    width: 16px;
    margin-right: var(--theme-form-element-radius);
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
    opacity: 0.5;

    &:hover {
      opacity: 1;
    }
  }
  IconOrImage {
    width: 100%;
    height: 100%;
  }
`;

interface Props<T extends string | number> extends ITag<T> {
  onRemove: (id: T) => void;
  className?: string;
}

export const Tag = observer(function Tag<T extends string | number>({ id, label, icon, onRemove, className }: Props<T>) {
  return styled(style)(
    <tag-container as="li" title={label} className={className}>
      {icon && (
        <tag-icon>
          <IconOrImage icon={icon} />
        </tag-icon>
      )}
      <tag-content>{label}</tag-content>
      <tag-actions>
        <tag-action onClick={() => onRemove(id)}>
          <IconOrImage icon="cross" />
        </tag-action>
      </tag-actions>
    </tag-container>,
  );
});
