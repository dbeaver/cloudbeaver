/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { HTMLProps } from 'react';

import { CheckCircle, Frown } from '@cloudbeaver/core-blocks';
import { ENotificationType } from '@cloudbeaver/core-events';

type IconProps = HTMLProps<HTMLDivElement> & {
    type: ENotificationType;
  }

export function NotificationMark({ type, ...props }: IconProps) {
  return (
    <div {...props}>
      {type === ENotificationType.Info && <CheckCircle />}
      {type === ENotificationType.Error && <Frown />}
    </div>
  );
}
