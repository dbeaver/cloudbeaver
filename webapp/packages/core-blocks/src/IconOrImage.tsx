/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';

import { Icon } from './Icons';
import { StaticImage } from './StaticImage';

export type IconOrImageProps = {
  icon: string;
  className?: string;
  viewBox?: string;
};

export const IconOrImage = function IconOrImage({ icon, className, viewBox }: IconOrImageProps) {

  const isStaticIcon = useMemo(
    () => icon && (icon.startsWith('platform:') || icon.startsWith('/')),
    [icon]
  );

  if (isStaticIcon) {
    return <StaticImage icon={icon} className={className}/>;
  }

  return <Icon name={icon} className={className} viewBox={viewBox || '0 0 32 32'} />;
};
