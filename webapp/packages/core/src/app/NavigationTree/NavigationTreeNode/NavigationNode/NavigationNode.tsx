/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  MouseEvent, KeyboardEvent, useCallback, PropsWithChildren,
} from 'react';
import styled, { use } from 'reshadow';

import { Icon, StaticImage, Loader } from '@dbeaver/core/blocks';
import { useStyles } from '@dbeaver/core/theming';

import { navigationNodeStyles } from './navigationNodeStyles';

type NodeProps = PropsWithChildren<{
  id: string;
  title?: string;
  icon?: string;
  isExpanded: boolean;
  isLoading: boolean;
  isSelected: boolean;
  portal?: JSX.Element;
  isExpandable?: boolean;
  onExpand?: () => void;
  onDoubleClick?: () => void;
  onClick?: (isMultiple?: boolean) => void;
}>

const KEYCODE = {
  ENTER: 13,
  UP: 38,
  DOWN: 40,
};

export function NavigationNode({
  title,
  icon,
  children,
  isLoading,
  isExpanded,
  isSelected,
  portal,
  isExpandable,
  onExpand,
  onDoubleClick,
  onClick,
}: NodeProps) {

  const styles = useStyles(navigationNodeStyles);

  const handleExpand = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (onExpand) {
        onExpand();
      }
    },
    [onExpand]
  );

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (onClick) {
        onClick(e.ctrlKey);
      }
    },
    [onClick]
  );

  const handleEnter = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      switch (event.keyCode) {
        case KEYCODE.ENTER:
          if (onClick) {
            onClick(event.ctrlKey);
          }
          break;
      }
      return true;
    },
    [onClick]
  );

  return styled(styles)(
    <>
      <node as="div" {...use({ isExpanded: isExpanded && isExpandable })}>
        <control
          tabIndex={0}
          aria-selected={isSelected}
          onClick={handleClick}
          onKeyDown={handleEnter}
          onDoubleClick={onDoubleClick}
          as="div"
        >
          <arrow as="div" hidden={!isExpandable} onClick={handleExpand}>
            {isLoading && <Loader small />}
            {!isLoading && <Icon name="arrow" viewBox="0 0 16 16" />}
          </arrow>
          <icon as="div"><StaticImage icon={icon} /></icon>
          <name as="div">{title}</name>
          <portal as="div">{portal}</portal>
        </control>
      </node>
      <nested as="div">{children}</nested>
    </>
  );
}
