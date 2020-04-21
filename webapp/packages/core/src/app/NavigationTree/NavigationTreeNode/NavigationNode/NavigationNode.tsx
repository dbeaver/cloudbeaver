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
  isLoaded?: boolean;
  isSelected: boolean;
  portal?: JSX.Element;
  isExpandable?: boolean;
  onExpand?: (id: string) => void;
  onDoubleClick?: (id: string) => void;
  onClick?: (id: string, isMultiple?: boolean) => void;
}>

const KEYCODE = {
  ENTER: 13,
  UP: 38,
  DOWN: 40,
};

export function NavigationNode(
  props: NodeProps
) {
  const {
    id,
    title,
    icon,
    children,
    isLoaded,
    isExpanded,
    isSelected,
    portal,
    isExpandable,
    onExpand,
    onDoubleClick,
    onClick,
  } = props;

  const styles = useStyles(navigationNodeStyles);

  const handleExpand = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (onExpand) {
        onExpand(id);
      }
    },
    [id, onExpand]
  );

  const handleDoubleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (onDoubleClick) {
        onDoubleClick(id);
      }
    },
    [id, onDoubleClick]
  );

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (onClick) {
        onClick(id, e.ctrlKey);
      }
    },
    [id, onClick]
  );

  const handleEnter = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      switch (event.keyCode) {
        case KEYCODE.ENTER:
          if (onClick) {
            onClick(id, event.ctrlKey);
          }
          break;
      }
      return true;
    },
    [id, onClick]
  );

  return styled(styles)(
    <>
      <node as="div" {...use({ isExpanded: isExpanded && isLoaded })}>
        <control
          tabIndex={0}
          aria-selected={isSelected}
          onClick={handleClick}
          onKeyDown={handleEnter}
          onDoubleClick={handleDoubleClick}
          as="div"
        >
          <arrow as="div" hidden={!isExpandable} onClick={handleExpand}>
            {!isLoaded && isExpanded && <Loader small />}
            {(isLoaded || !isExpanded) && <Icon name="arrow" viewBox="0 0 16 16" />}
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
