/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useMemo } from 'react';

import { isValidUrl } from '@cloudbeaver/core-utils';

import { Icon } from './Icon.js';
import { StaticImage } from './StaticImage.js';

export interface IconOrImageProps {
  icon: string;
  className?: string;
  title?: string;
  svg?: boolean;
  onClick?: () => void;
  viewBox?: string;
  width?: number;
}

export const IconOrImage: React.FC<IconOrImageProps> = function IconOrImage({ icon, className, title, svg, onClick, viewBox, width }) {
  const isStaticIcon = useMemo(() => icon && (icon.startsWith('platform:') || icon.startsWith('/')), [icon]);

  if (!svg && (isStaticIcon || isValidUrl(icon))) {
    return <StaticImage title={title} icon={icon} width={width} className={className} onClick={onClick} />;
  }

  return <Icon name={icon} className={className} viewBox={viewBox || '0 0 32 32'} width={width} height={width} onClick={onClick} />;
};
