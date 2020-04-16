/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo, useState } from 'react';
import { create } from 'reshadow';

import { useService } from '@dbeaver/core/di';

import { ThemeService } from './ThemeService';
import { applyComposes, ClassCollection, Composes } from './themeUtils';

export type ThemeSelector = (theme: string) => Promise<ClassCollection | Composes>

export type Style = ClassCollection | Composes | ThemeSelector

/**
 * Must be observed from mobx
 *
 * @param componentStyles styles array
 */
export function useStyles(
  ...componentStyles: Style[]
) {

  // todo do you understand that we store ALL STYLES in each component that uses this hook?

  const [loadedStyles, setLoadedStyles] = useState<Array<ClassCollection | Composes>>([]);
  const themeService = useService(ThemeService);
  const currentThemeId = themeService.currentThemeId;

  useMemo(() => {
    Promise
      .all(
        componentStyles.map(
          style => ((typeof style === 'object' || style instanceof Composes) ? style : style(currentThemeId))
        )
      )
      .then(setLoadedStyles);
  }, [currentThemeId]);

  const styles = useMemo(() => {
    const themeStyles = themeService.getThemeStyles(currentThemeId);
    return applyComposes([...themeStyles, ...loadedStyles]);
  }, [currentThemeId, ...loadedStyles]);

  return create(styles); // todo this method is called in each rerender
}
