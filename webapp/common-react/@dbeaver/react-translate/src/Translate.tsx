/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { memo } from 'react';
import { useTranslate } from './useTranslate.js';

interface Props {
  children: string;
  args?: Record<string, any>;
  fallback?: string;
}

export const Translate = memo<Props>(function Translate({ children, args, fallback }) {
  const t = useTranslate();
  return t(children, fallback, args);
});
