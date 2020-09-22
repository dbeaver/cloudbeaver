/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObserver } from 'mobx-react';
import { useMemo, useState } from 'react';
import { create } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { flat } from '@cloudbeaver/core-utils';

import { ThemeService } from './ThemeService';
import { applyComposes, ClassCollection, Composes } from './themeUtils';

export type BaseStyles = ClassCollection | Composes
export type ThemeSelector = (theme: string) => Promise<BaseStyles | BaseStyles[]>
export type Style = BaseStyles | ThemeSelector

/**
 * Changes styles depending on theme
 *
 * @param componentStyles styles array
 */
export function useStyles(
  ...componentStyles: Array<Style | boolean | undefined>
): Record<string, any> {
  if (!componentStyles) {
    return {};
  }
  // todo do you understand that we store ALL STYLES in each component that uses this hook?

  const [loadedStyles, setLoadedStyles] = useState<BaseStyles[]>([]);
  const themeService = useService(ThemeService);
  const currentThemeId = useObserver(() => themeService.currentThemeId);
  const filteredStyles = componentStyles.filter(Boolean) as Array<Style>;

  useMemo(() => {
    const staticStyles: BaseStyles[] = [];
    const themedStyles = [];

    for (const style of filteredStyles) {
      const data = (typeof style === 'object' || style instanceof Composes) ? style : style(currentThemeId);

      if (data instanceof Promise) {
        themedStyles.push(data);
      } else {
        staticStyles.push(data);
      }
    }
    setLoadedStyles(flat(staticStyles));
    Promise
      .all(themedStyles)
      .then(styles => setLoadedStyles(flat([staticStyles, styles])));
  }, [currentThemeId, ...filteredStyles, filteredStyles.length]);

  const styles = useMemo(() => {
    const themeStyles = themeService.getThemeStyles(currentThemeId);
    return applyComposes([...themeStyles, ...loadedStyles]);
  }, [currentThemeId, ...loadedStyles, loadedStyles.length]);
  /* we put dynamic array length as the dependency because of preact bug,
     otherwise useMemo will not be triggered on array change */

  return create(styles); // todo this method is called in each rerender
}
