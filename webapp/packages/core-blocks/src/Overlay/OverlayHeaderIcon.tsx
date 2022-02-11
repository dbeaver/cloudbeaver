/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { IconOrImage } from '../IconOrImage';
import { OVERLAY_BASE_STYLES } from './OVERLAY_BASE_STYLES';

interface Props {
  icon?: string;
  viewBox?: string;
  className?: string;
}

export const OverlayHeaderIcon: React.FC<Props> = function OverlayHeaderIcon({ icon, viewBox, className, children }) {
  const style = useStyles(OVERLAY_BASE_STYLES);

  if (!icon && !children) {
    return null;
  }

  return styled(style)(
    <icon-container className={className}>
      {icon && <IconOrImage icon={icon} viewBox={viewBox} />}
      {children}
    </icon-container>
  );
};