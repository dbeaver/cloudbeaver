/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { OVERLAY_BASE_STYLES } from './OVERLAY_BASE_STYLES';

interface Props {
  active?: boolean;
  className?: string;
}

export const Overlay = observer<Props>(function Overlay({
  active,
  className,
  children,
}) {
  const styles = useStyles(OVERLAY_BASE_STYLES);

  if (!active) {
    return null;
  }

  return styled(styles)(
    <overlay className={className} {...use({ active })}>
      <box>
        {children}
      </box>
    </overlay>
  );
});