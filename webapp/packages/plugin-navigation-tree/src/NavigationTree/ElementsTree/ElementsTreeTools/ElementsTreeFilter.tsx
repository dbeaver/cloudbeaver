/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Filter, s, useFocus, useS, useTranslate } from '@cloudbeaver/core-blocks';

import type { IElementsTree } from '../useElementsTree.js';
import styles from './ElementsTreeFilter.module.css';

interface Props {
  tree: IElementsTree;
  className?: string;
}

export const ElementsTreeFilter = observer<Props>(function ElementsTreeFilter({ tree, className }) {
  const [focusedRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });
  const translate = useTranslate();
  const computedStyles = useS(styles);

  if (!tree.settings?.filter) {
    return null;
  }

  return (
    <div ref={focusedRef} className={s(computedStyles, { filterBox: true }, className)}>
      <Filter placeholder={translate('app_navigationTree_search')} value={tree.filter} onChange={value => tree.setFilter(value as string)} />
    </div>
  );
});
