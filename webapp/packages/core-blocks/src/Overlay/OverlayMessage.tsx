/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { OVERLAY_BASE_STYLES } from './OVERLAY_BASE_STYLES';

interface Props {
  className?: string;
}

export const OverlayMessage = observer<React.PropsWithChildren<Props>>(function OverlayMessage({
  className,
  children,
}) {
  return styled(useStyles(OVERLAY_BASE_STYLES))(
    <message className={className}>
      <message-box>
        {children}
      </message-box>
    </message>
  );
});