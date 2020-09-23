/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SVGAttributes } from 'react';

export function Icon(props: SVGAttributes<any>) {
  const { name = '', className, ...rest } = props;
  const cn = `icon ${className || ''}`;
  const url = name.startsWith('/') ? name : `icons/icons.svg#${name}`;
  return (
    <svg {...rest} className={cn} aria-hidden="true" focusable="false">
      <use href={url} />
    </svg>
  );
}
