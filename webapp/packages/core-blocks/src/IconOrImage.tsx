/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';

import { isValidUrl } from '@cloudbeaver/core-utils';

import { Icon } from './Icon';
import { StaticImage } from './StaticImage';

export interface IconOrImageProps {
  icon: string;
  className?: string;
  title?: string;
  onClick?: () => void;
  viewBox?: string;
}

export const IconOrImage: React.FC<IconOrImageProps> = function IconOrImage({ icon, className, title, onClick, viewBox }) {
  const isStaticIcon = useMemo(
    () => icon && (icon.startsWith('platform:') || icon.startsWith('/')),
    [icon]
  );

  if (isStaticIcon || isValidUrl(icon)) {
    return <StaticImage title={title} icon={icon} className={className} onClick={onClick} />;
  }

  return <Icon name={icon} className={className} viewBox={viewBox || '0 0 32 32'} onClick={onClick} />;
};
