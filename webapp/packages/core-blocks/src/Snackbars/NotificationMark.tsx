/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { HTMLProps } from 'react';

import { ENotificationType } from '@cloudbeaver/core-events';

import { IconOrImage } from '../IconOrImage.js';

type IconProps = HTMLProps<HTMLDivElement> & {
  type: ENotificationType;
};

export const NotificationMark: React.FC<IconProps> = function NotificationMark({ type, ...props }) {
  return (
    <div aria-hidden {...props}>
      {type === ENotificationType.Info && <IconOrImage icon="/icons/preload/info_icon.svg" />}
      {type === ENotificationType.Error && <IconOrImage icon="/icons/preload/error_icon.svg" />}
      {type === ENotificationType.Success && <IconOrImage icon="/icons/preload/success_icon.svg" />}
    </div>
  );
};
