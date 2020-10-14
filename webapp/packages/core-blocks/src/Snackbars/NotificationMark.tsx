/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { HTMLProps } from 'react';

import { ENotificationType } from '@cloudbeaver/core-events';

import { IconOrImage } from '../IconOrImage';

type IconProps = HTMLProps<HTMLDivElement> & {
  type: ENotificationType;
};

export function NotificationMark({ type, ...props }: IconProps) {
  return (
    <div {...props}>
      {type === ENotificationType.Info && <IconOrImage icon='/icons/info_icon.svg' />}
      {type === ENotificationType.Error && <IconOrImage icon='/icons/error_icon.svg' />}
      {type === ENotificationType.Success && <IconOrImage icon='/icons/success_icon.svg' />}
    </div>
  );
}
