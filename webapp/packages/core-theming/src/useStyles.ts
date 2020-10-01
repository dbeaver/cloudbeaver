/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObserver } from 'mobx-react';
import { useMemo, useRef, useState } from 'react';
import { create } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { flat } from '@cloudbeaver/core-utils';

import { ThemeService } from './ThemeService';
import { applyComposes, ClassCollection, Composes } from './themeUtils';

export type BaseStyles = ClassCollection | Composes
export type ThemeSelector = (theme: string) => Promise<BaseStyles | BaseStyles[]>
export type Style = BaseStyles | ThemeSelector
export type DynamicStyle = Style | boolean | undefined;

/**
 * Changes styles depending on theme
 *
 * @param componentStyles styles array
 */
export function useStyles(
  ...componentStyles: (DynamicStyle | DynamicStyle[])[]
): Record<string, any> {
  if (!componentStyles) {
    return {};
  }
  // todo do you understand that we store ALL STYLES in each component that uses this hook?

  const stylesRef = useRef<(DynamicStyle | DynamicStyle[])[]>([]);
  const [patch, forceUpdate] = useState(0);
  const loadedStyles = useRef<BaseStyles[]>([]);
  const themeService = useService(ThemeService);
  const currentThemeId = useObserver(() => themeService.currentThemeId);
  const lastThemeRef = useRef<string>(currentThemeId);
  const filteredStyles = flat(componentStyles).filter(Boolean) as Array<Style>;

  let changed = lastThemeRef.current !== currentThemeId || componentStyles.length !== stylesRef.current.length;
  for (let i = 0; !changed && i < componentStyles.length; i++) {
    changed = stylesRef.current[i] !== componentStyles[i];
  }

  if (changed) {
    stylesRef.current = componentStyles;
    lastThemeRef.current = currentThemeId;
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
    loadedStyles.current = flat(staticStyles);

    Promise
      .all(themedStyles)
      .then((styles) => {
        loadedStyles.current = flat([staticStyles, styles]);
        forceUpdate(v => v++);
      });
  }

  const styles = useMemo(() => {
    const themeStyles = themeService.getThemeStyles(currentThemeId);
    return applyComposes([...themeStyles, ...loadedStyles.current]);
  }, [currentThemeId, patch, loadedStyles.current]);

  return create(styles); // todo this method is called in each rerender
}
