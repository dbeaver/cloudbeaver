/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObserver } from 'mobx-react';
import { useEffect } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { ThemeService } from './ThemeService';

/**
 * Must be observed from mobx
 */
export function useTheme() {
  const themeService = useService(ThemeService);
  const className = useObserver(() => themeService.currentTheme.className);

  useEffect(() => {
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className]);
}
