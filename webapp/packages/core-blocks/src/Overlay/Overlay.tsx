/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { use } from 'reshadow';

import { OVERLAY_BASE_STYLES } from './OVERLAY_BASE_STYLES';

interface Props {
  active?: boolean;
  fill?: boolean;
  className?: string;
}

export const Overlay = observer<React.PropsWithChildren<Props>>(function Overlay({ active, fill, className, children }) {
  if (!active) {
    return null;
  }

  return styled(OVERLAY_BASE_STYLES)(
    <overlay className={className} {...use({ active, fill })}>
      <box>{children}</box>
    </overlay>,
  );
});
