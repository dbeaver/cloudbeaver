/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { GlobalConstants, isValidUrl } from '@cloudbeaver/core-utils';

import { s } from './s.js';
import style from './StaticImage.module.css';
import { useS } from './useS.js';

interface Props {
  icon?: string;
  className?: string;
  title?: string;
  width?: number;
  block?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const StaticImage: React.FC<Props> = function StaticImage({ icon, className, title, width, block, onClick }) {
  const styles = useS(style);
  if (!icon) {
    return null;
  }

  const url = isValidUrl(icon) ? icon : GlobalConstants.absoluteUrl(icon);

  return <img alt={title} className={s(styles, { block }, className)} src={url} title={title} width={width} onClick={onClick} />;
};
