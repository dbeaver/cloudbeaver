/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, useEffect, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';

import { InputFieldNew } from '../../FormControls/InputFieldNew';
import { IconButton } from '../../IconButton';
import { useFocus } from '../../useFocus';
import { TreeNodeContext } from './TreeNodeContext';

const styles = css`
    InputFieldNew {
      display: none;
      width: 300px;
      max-width: 300px;
      &[|filterMode] {
        display: block;
        & > :global(input) {
          height: 28px;
          padding-right: 24px !important;
        }
        & > :global(label) {
          padding-bottom: 0;
        }
      }
    }

    IconButton {
      position: absolute;
      left: 0;
      margin: 0;
      background: #cccccc;
      width: 24px;
      height: 24px;
      cursor: pointer;
      &[|filterMode] {
        /* 24px icon width + 2px input border */
        left: calc(100% - 26px);
      }
    }
  `;

const filterButtonMode = {
  filter: composes(
    css`
      IconButton {
        composes: theme-background-primary theme-text-on-primary from global;
      }
    `),
  passive:
    css`
      IconButton {
        color: #398fca;
        background-color: #cccccc;
        border-radius: 2px;
      }
  `,
};

interface Props {
  disabled?: boolean;
  className?: string;
}

export const TreeNodeFilter: React.FC<Props> = function TreeNodeFilter({
  disabled,
  className,
}) {
  const [focusedRef] = useFocus<HTMLInputElement>({});
  const context = useContext(TreeNodeContext);
  const [filterMode, setFilterMode] = useState(!!context?.filterValue);

  if (!context) {
    throw new Error('Context not provided');
  }

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  const preventPropagation = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };

  useEffect(() => {
    if (filterMode) {
      focusedRef.current?.focus();
    }
  }, [filterMode]);

  return styled(useStyles(styles, filterMode ? filterButtonMode.filter : filterButtonMode.passive))(
    <filter-container as='div' className={className} onClick={handleClick} onDoubleClick={preventPropagation}>
      <InputFieldNew
        ref={focusedRef}
        disabled={disabled}
        value={context.filterValue}
        {...use({ filterMode })}
        onChange={value => context.filter(value.trim())}
      />
      <IconButton name='search' disabled={disabled} onClick={() => setFilterMode(!filterMode)} {...use({ filterMode })} />
    </filter-container>
  );
};
