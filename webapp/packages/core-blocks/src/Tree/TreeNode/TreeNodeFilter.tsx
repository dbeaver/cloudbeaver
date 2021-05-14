/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useEffect, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';

import { InputFieldNew } from '../../FormControls/InputFieldNew';
import { IconButton } from '../../IconButton';
import { useFocus } from '../../useFocus';
import { TreeNodeContext } from './TreeNodeContext';

const styles = composes(
  css`
    IconButton {
      composes: theme-background-primary theme-text-on-primary from global;
    }
  `,
  css`
    InputFieldNew {
      display: none;
      width: 300px;
      &[|filterEnabled] {
        display: block;
      }
    }
    IconButton {
      position: absolute;
      right: 2px;
      margin: 0;
      width: 24px;
      height: 24px;
      cursor: pointer;
      border-radius: 2px;
      &[|filterEnabled] {
        border-radius: unset;
      }
    }
`);

const innerInputStyle = css`
  input {
    height: 28px;
    padding-right: 24px !important;
  }
`;

interface Props {
  disabled?: boolean;
  className?: string;
}

export const TreeNodeFilter: React.FC<Props> = observer(function TreeNodeFilter({
  disabled,
  className,
}) {
  const context = useContext(TreeNodeContext);
  const [inputRef] = useFocus<HTMLInputElement>({});
  const [filterEnabled, setFilterEnabled] = useState(false);

  if (!context) {
    throw new Error('Context not provided');
  }

  const onFilterEnabledChange = useCallback(() => {
    setFilterEnabled(prev => {
      if (prev) {
        context.filter('');
      }

      return !prev;
    });
  }, [context]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      event.stopPropagation();
    }
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  const preventPropagation = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };

  useEffect(() => {
    if (filterEnabled) {
      inputRef.current?.focus();
    }
  }, [filterEnabled]);

  useEffect(() => () => { context.filter(''); }, []);

  return styled(useStyles(styles))(
    <filter-container className={className} onClick={handleClick} onDoubleClick={preventPropagation}>
      <InputFieldNew
        ref={inputRef}
        style={innerInputStyle}
        disabled={disabled}
        value={context.filterValue}
        {...use({ filterEnabled })}
        onKeyDown={onKeyDown}
        onChange={value => context.filter(String(value).trim())}
      />
      <IconButton name='search' disabled={disabled} onClick={onFilterEnabledChange} {...use({ filterEnabled })} />
    </filter-container>
  );
});
