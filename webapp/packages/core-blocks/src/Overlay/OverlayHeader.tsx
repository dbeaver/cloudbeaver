/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import styled from 'reshadow';

import { OVERLAY_BASE_STYLES } from './OVERLAY_BASE_STYLES';

interface Props {
  className?: string;
}

export const OverlayHeader: React.FC<React.PropsWithChildren<Props>> = function OverlayHeader({ className, children }) {
  return styled(OVERLAY_BASE_STYLES)(<header className={className}>{children}</header>);
};
