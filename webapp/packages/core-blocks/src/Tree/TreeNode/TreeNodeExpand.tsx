/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { EventContext } from '@cloudbeaver/core-events';
import { Spinner } from '@dbeaver/ui-kit';

import { Clickable } from '../../Clickable.js';
import { getComputed } from '../../getComputed.js';
import { Icon } from '../../Icon.js';
import { useTranslate } from '../../localization/useTranslate.js';
import { s } from '../../s.js';
import { useS } from '../../useS.js';
import { useStateDelay } from '../../useStateDelay.js';
import { EventTreeNodeExpandFlag } from './EventTreeNodeExpandFlag.js';
import { TreeNodeContext } from './TreeNodeContext.js';
import style from './TreeNodeExpand.module.css';

interface Props {
  leaf?: boolean;
  big?: boolean;
  filterActive?: boolean;
  disabled?: boolean;
  className?: string;
}

export const TreeNodeExpand = observer<Props>(function TreeNodeExpand({ leaf, big, filterActive, disabled, className }) {
  const translate = useTranslate();
  const styles = useS(style);
  const context = useContext(TreeNodeContext);

  if (!context) {
    throw new Error('Context not provided');
  }

  const showInFilter = context.showInFilter;
  disabled = getComputed(() => context.externalExpanded || context.disabled) || disabled;
  leaf = context.leaf || leaf;
  const loading = useStateDelay(
    getComputed(() => context.loading || context.processing),
    300,
  );
  const expandable = getComputed(() => !loading && (!leaf || context.externalExpanded));

  async function handleExpand(event: React.MouseEvent<HTMLDivElement>) {
    EventContext.set(event, EventTreeNodeExpandFlag);

    if (!leaf && !disabled) {
      await context.expand();
    }
  }

  function handleDbClick(event: React.MouseEvent<HTMLDivElement>) {
    EventContext.set(event, EventTreeNodeExpandFlag);
  }

  let iconName = 'arrow';
  let viewBox = '0 0 16 16';

  if (big) {
    iconName = 'angle';
    viewBox = '0 0 15 8';
  }

  if (filterActive) {
    if (big) {
      if (showInFilter) {
        iconName = '/icons/delete_m.svg#root';
        viewBox = '0 0 24 24';
      } else {
        iconName = '/icons/add_m.svg#root';
        viewBox = '0 0 24 24';
      }
    } else {
      if (showInFilter) {
        iconName = '/icons/delete_sm.svg#root';
        viewBox = '0 0 16 16';
      } else {
        iconName = '/icons/add_sm.svg#root';
        viewBox = '0 0 16 16';
      }
    }
  }

  const title = translate('ui_expand');

  return (
    <Clickable
      as="div"
      role="button"
      title={title}
      aria-label={title}
      className={s(styles, { treeNodeExpand: true, expanded: context.expanded }, className)}
      focusable={expandable}
      disabled={disabled || !expandable}
      onClick={handleExpand}
      onDoubleClick={handleDbClick}
    >
      {loading && <Spinner size="small" active />}
      {expandable && <Icon name={iconName} className={s(styles, { icon: true })} viewBox={viewBox} />}
    </Clickable>
  );
});
