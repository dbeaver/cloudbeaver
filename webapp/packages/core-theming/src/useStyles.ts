/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo, useRef, useState } from 'react';
import { create } from 'reshadow';

import { useExecutor } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { flat } from '@cloudbeaver/core-utils';

import { ThemeService } from './ThemeService';
import type { ClassCollection } from './themeUtils';

export type BaseStyles = ClassCollection;
export type ThemeSelector = (theme: string) => Promise<undefined | BaseStyles | BaseStyles[]>;
export type Style = BaseStyles | ThemeSelector;
export type DynamicStyle = Style | boolean | undefined;
export type ComponentStyle = DynamicStyle | DynamicStyle[];

/**
 * Changes styles depending on theme
 *
 * @param componentStyles styles array
 */
export function useStyles(
  ...componentStyles: ComponentStyle[]
): Record<string, any> {
  // todo do you understand that we store ALL STYLES in each component that uses this hook?

  const stylesRef = useRef<ComponentStyle[]>([]);
  const [patch, forceUpdate] = useState(0);
  const loadedStyles = useRef<BaseStyles[]>([]);
  const themeService = useService(ThemeService);
  const [currentThemeId, setCurrentThemeId] = useState(() => themeService.currentThemeId);
  const lastThemeRef = useRef<string>(currentThemeId);
  const filteredStyles = flat(componentStyles).filter(Boolean) as Style[];
  const trackTheme = filteredStyles.some(style => typeof style === 'function');

  useExecutor({
    executor: themeService.onThemeChange,
    handlers: [function updateThemeId(theme) {
      if (currentThemeId !== themeService.currentThemeId && trackTheme) {
        setCurrentThemeId(theme.id);
      }
    }],
  });

  let changed = lastThemeRef.current !== currentThemeId || filteredStyles.length !== stylesRef.current.length;
  for (let i = 0; !changed && i < filteredStyles.length; i++) {
    changed = stylesRef.current[i] !== filteredStyles[i];
  }

  if (changed) {
    stylesRef.current = filteredStyles;
    lastThemeRef.current = currentThemeId;
    const staticStyles: BaseStyles[] = [];
    const themedStyles: Array<Promise<undefined | BaseStyles | BaseStyles[]>> = [];

    for (const style of filteredStyles) {
      const data = typeof style === 'object' ? style : style(currentThemeId);

      if (data instanceof Promise) {
        themedStyles.push(data);
      } else {
        staticStyles.push(data);
      }
    }
    loadedStyles.current = flat(staticStyles);

    if (themedStyles.length > 0) {
      Promise
        .all(themedStyles)
        .then(styles => {
          loadedStyles.current = flat([staticStyles, flat(styles)])
            .filter(Boolean) as BaseStyles[];
          forceUpdate(patch + 1);
        });
    }
  }

  const styles = useMemo(() => create(loadedStyles.current), [patch, loadedStyles.current]);

  return styles; // todo this method is called in each rerender
}

export function joinStyles(...styles: ComponentStyle[]): ComponentStyle {
  return styles.flat();
}
