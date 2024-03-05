/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { MenuSeparator as MenuSeparatorBase } from 'reakit/Menu';
import type { SeparatorOptions } from 'reakit/ts';

import { s } from '../s';
import { useS } from '../useS';
import style from './MenuSeparator.m.css';
import type { ReakitProxyComponentOptions } from './ReakitProxyComponent';

export const MenuSeparator = function MenuSeparator({ className, ...props }: ReakitProxyComponentOptions<'hr', SeparatorOptions>) {
  const styles = useS(style);
  return <MenuSeparatorBase {...props} className={s(styles, { menuSeparator: true }, className)} />;
};
