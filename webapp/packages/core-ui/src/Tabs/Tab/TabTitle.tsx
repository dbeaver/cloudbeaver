/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { BASE_TAB_STYLES } from './BASE_TAB_STYLES';

interface IProps {
  className?: string;
}

export const TabTitle: React.FC<React.PropsWithChildren<IProps>> = function TabTitle({ children, className }) {
  return styled(BASE_TAB_STYLES)(
    <tab-title className={className}>
      {children || <placeholder />}
    </tab-title>
  );
};
