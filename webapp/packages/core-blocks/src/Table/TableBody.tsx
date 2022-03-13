/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { BASE_TABLE_STYLES } from './BASE_TABLE_STYLES';

interface Props {
  className?: string;
}

export const TableBody: React.FC<Props> = function TableBody({ children, className }) {
  return styled(BASE_TABLE_STYLES)(
    <tbody className={className}>
      {children}
    </tbody>
  );
};
