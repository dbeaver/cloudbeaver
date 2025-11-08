/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import clsx from 'clsx';

type IconNames =
  | 'replace'
  | 'replace-all'
  | 'match-word'
  | 'case'
  | 'regex'
  | 'sort-asc'
  | 'sort-desc'
  | 'cross'
  | 'sort-unknown'
  | 'arrow-up'
  | 'arrow-down'
  | 'no-color'
  | 'fill-color';

export interface IconProps {
  name: IconNames;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, className, size = 'small', color, style }: IconProps) {
  const sizeAffix = size === 'small' ? '_sm' : size === 'large' ? '' : '_m';
  const w = size === 'small' ? 16 : size === 'large' ? 32 : 24;
  return (
    <svg width={w} height={w} viewBox={`0 0 ${w} ${w}`} className={clsx('dbv-kit-icon', className)} style={{ color, ...style }}>
      <use href={`#icon-${name}${sizeAffix}`} />
    </svg>
  );
}
