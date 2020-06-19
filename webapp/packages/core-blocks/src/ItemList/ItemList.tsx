/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { useStyles, Style } from '@cloudbeaver/core-theming';

import { Styles, ITEM_LIST_STYLES_ARRAY } from './styles';

type ItemListProps = React.PropsWithChildren<{
  className?: string;
  styles?: Style[];
}>

export function ItemList({
  children, className, styles,
}: ItemListProps) {

  return styled(useStyles(...(styles || ITEM_LIST_STYLES_ARRAY)))(
    <item-list as="div" className={className}>
      <Styles.Provider value={styles || ITEM_LIST_STYLES_ARRAY}>
        {children}
      </Styles.Provider>
    </item-list>
  );
}
