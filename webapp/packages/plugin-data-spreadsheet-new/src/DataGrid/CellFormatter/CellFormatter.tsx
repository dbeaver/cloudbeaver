/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { FormatterProps } from 'react-data-grid';

export const CellFormatter: React.FC<FormatterProps> = function CellFormatter(props) {
  const { row, column } = props;

  return (
    <div>
      {JSON.stringify(row[column.key])}
    </div>
  );
};
