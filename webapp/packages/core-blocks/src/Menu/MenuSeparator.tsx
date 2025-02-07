/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { MenuSeparator as MenuSeparatorBase, type SeparatorOptions } from 'reakit';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './MenuSeparator.module.css';
import type { ReakitProxyComponentOptions } from './ReakitProxyComponent.js';

export const MenuSeparator = function MenuSeparator({ className, ...props }: ReakitProxyComponentOptions<'hr', SeparatorOptions>) {
  const styles = useS(style);
  return <MenuSeparatorBase {...props} className={s(styles, { menuSeparator: true }, className)} />;
};
