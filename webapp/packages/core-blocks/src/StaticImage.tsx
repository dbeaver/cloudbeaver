/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { GlobalConstants, isValidUrl } from '@cloudbeaver/core-utils';

interface Props {
  icon?: string;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const StaticImage: React.FC<Props> = function StaticImage({
  icon, className, title, onClick,
}) {
  if (!icon) {
    return null;
  }

  const url = isValidUrl(icon) ? icon : GlobalConstants.absoluteUrl(icon);

  return <img className={className} src={url} title={title} onClick={onClick} />;
};
