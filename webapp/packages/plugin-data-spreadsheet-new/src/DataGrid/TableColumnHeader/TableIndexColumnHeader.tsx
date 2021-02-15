/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';
import type { HeaderRendererProps } from 'react-data-grid';

import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';

export const TableIndexColumnHeader: React.FC<HeaderRendererProps<any>> = function TableIndexColumnHeader(props) {
  const selectionContext = useContext(DataGridSelectionContext);

  if (!selectionContext) {
    throw new Error('Selection context must be provided');
  }

  const indexClickHandler = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    selectionContext.selectTable();
  };

  return (
    <div onClick={indexClickHandler}>{props.column.name}</div>
  );
};
