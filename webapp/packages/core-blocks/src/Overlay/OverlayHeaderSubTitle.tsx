/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { OVERLAY_BASE_STYLES } from './OVERLAY_BASE_STYLES';

interface Props {
  className?: string;
}

export const OverlayHeaderSubTitle: React.FC<Props> = function OverlayHeaderSubTitle({ className, children }) {
  return styled(useStyles(OVERLAY_BASE_STYLES))(
    <sub-title className={className}>{children}</sub-title>
  );
};