/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use } from 'reshadow';

import { BASE_TABLE_STYLES } from './BASE_TABLE_STYLES';

interface Props {
  fixed?: boolean;
  className?: string;
}

export const TableHeader: React.FC<React.PropsWithChildren<Props>> = function TableHeader({ fixed, children, className }) {
  return styled(BASE_TABLE_STYLES)(
    <thead className={className} {...use({ fixed })}>
      <tr>
        {children}
      </tr>
    </thead>
  );
};
