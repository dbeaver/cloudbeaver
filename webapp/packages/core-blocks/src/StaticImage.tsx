/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PropsWithChildren } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { EnvironmentService } from '@cloudbeaver/core-sdk';

type StaticImageProps = PropsWithChildren<{
  icon?: string;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
}>

export function StaticImage({
  icon, className, title, onClick,
}: StaticImageProps) {
  const { staticEndpoint } = useService(EnvironmentService);

  if (!icon) {
    return null;
  }

  const url = icon[0] === '/' ? icon : `${staticEndpoint}/images/${icon}`;

  return <img className={className} src={url} title={title} onClick={onClick}/>;
}
