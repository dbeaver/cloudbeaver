/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Filter, s, useFocus, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import type { IElementsTree } from '../useElementsTree';
import styles from './ElementsTreeFilter.m.css';

interface Props {
  tree: IElementsTree;
  style?: ComponentStyle;
  className?: string;
}

export const ElementsTreeFilter = observer<Props>(function ElementsTreeFilter({ tree, style, className }) {
  const [focusedRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });
  const translate = useTranslate();
  const computedStyles = useS(styles, style);

  if (!tree.settings?.filter) {
    return null;
  }

  return (
    <div ref={focusedRef} className={s(computedStyles, { filterBox: true }, className)}>
      <Filter placeholder={translate('app_navigationTree_search')} value={tree.filter} max onFilter={value => tree.setFilter(value as string)} />
    </div>
  );
});
