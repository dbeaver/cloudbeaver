/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { HTMLProps } from 'react';

import { ENotificationType } from '@cloudbeaver/core-events';

import { IconOrImage } from '../IconOrImage';

type IconProps = HTMLProps<HTMLDivElement> & {
  type: ENotificationType;
};

export const NotificationMark: React.FC<IconProps> = function NotificationMark({ type, ...props }) {
  return (
    <div {...props}>
      {type === ENotificationType.Info && <IconOrImage icon='/icons/info_icon.svg' />}
      {type === ENotificationType.Error && <IconOrImage icon='/icons/error_icon.svg' />}
      {type === ENotificationType.Success && <IconOrImage icon='/icons/success_icon.svg' />}
    </div>
  );
};
