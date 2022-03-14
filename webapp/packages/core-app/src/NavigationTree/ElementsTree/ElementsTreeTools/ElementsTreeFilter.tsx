/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Filter, useFocus } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import type { IElementsTree } from '../useElementsTree';

const filterStyle = css`
    filter-box {
      composes: theme-background-surface from global;
      padding: 8px 12px;
      flex: 0 0 auto;
    }
  `;

interface Props {
  tree: IElementsTree;
  style?: ComponentStyle;
  className?: string;
}

export const ElementsTreeFilter = observer<Props>(function ElementsTreeFilter({
  tree,
  style,
  className,
}) {
  const [focusedRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });
  const translate = useTranslate();
  const styles = useStyles(filterStyle, style);

  if (!tree.settings?.filter) {
    return null;
  }

  return styled(styles)(
    <filter-box ref={focusedRef} className={className} as='div'>
      <Filter
        placeholder={translate('app_navigationTree_search')}
        value={tree.filter}
        max
        onFilter={value => tree.setFilter(value as string)}
      />
    </filter-box>
  );
});