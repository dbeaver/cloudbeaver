/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { IconOrImage, useStyles } from '@cloudbeaver/core-blocks';

import { BASE_TAB_STYLES } from './BASE_TAB_STYLES';

interface IProps {
  icon?: string;
  viewBox?: string;
  className?: string;
}

export const TabIcon: React.FC<IProps> = function TabIcon({ icon, viewBox, className }) {
  return styled(useStyles(BASE_TAB_STYLES))(
    <tab-icon className={className}>
      {icon ? <IconOrImage icon={icon} viewBox={viewBox} /> : <placeholder />}
    </tab-icon>
  );
};
