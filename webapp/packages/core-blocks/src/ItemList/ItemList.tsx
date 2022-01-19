/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';

import { Styles, ITEM_LIST_STYLES } from './styles';

interface IProps {
  className?: string;
  styles?: ComponentStyle;
}

export const ItemList: React.FC<IProps> = function ItemList({
  children, className, styles,
}) {
  return styled(useStyles(styles || ITEM_LIST_STYLES))(
    <item-list className={className}>
      <item-list-overflow-top />
      <Styles.Provider value={styles || ITEM_LIST_STYLES}>
        {children}
      </Styles.Provider>
      <item-list-overflow />
    </item-list>
  );
};
