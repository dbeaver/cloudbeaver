/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { type BaseStyles, type ClassCollection, type ComponentStyle, type Style, type ThemeSelector, ThemeService } from '@cloudbeaver/core-theming';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { SContextReact } from './SContext.js';
import { useExecutor } from './useExecutor.js';

const stylesCache = new MetadataMap<string, Map<ThemeSelector<any>, Promise<undefined | BaseStyles | BaseStyles[]>>>(() => new Map());

type Intersect<T> = (T extends any ? (x: T) => 0 : never) extends (x: infer R) => 0
  ? R extends Record<string, string>
    ? BaseStyles<R>
    : never
  : never;

type ExtractStyles<T extends ComponentStyle[]> = Intersect<
  T extends (infer U)[]
    ? U extends BaseStyles
      ? U
      : U extends (theme: string) => Promise<infer A>
        ? A extends BaseStyles
          ? A
          : never
        : never
    : never
>;

/**
 * Changes styles depending on theme
 *
 * @param componentStyles styles array
 */
export function useS<T extends ComponentStyle[]>(...componentStyles: [...T]): ExtractStyles<T> {
  // todo do you understand that we store ALL STYLES in each component that uses this hook?

  const context = useContext(SContextReact);
  const stylesRef = useRef<ComponentStyle[]>([]);
  const [patch, forceUpdate] = useState(0);
  const loadedStyles = useRef<BaseStyles[]>([]);
  const themeService = useService(ThemeService, true);
  const [currentThemeId, setCurrentThemeId] = useState(() => themeService?.themeId);
  const lastThemeRef = useRef<string | undefined>(currentThemeId);
  const filteredStyles = themeService
    ? // @ts-ignore
      themeService.mapStyles(componentStyles.flat(Infinity).filter(Boolean) as Style[], context)
    : (componentStyles.flat(Infinity).filter(Boolean) as Style[]);
  const trackTheme = filteredStyles.some(style => typeof style === 'function');

  useExecutor({
    executor: themeService?.onChange,
    handlers: [
      function updateThemeId(theme) {
        if (currentThemeId !== themeService?.themeId && trackTheme) {
          setCurrentThemeId(theme.id);
        }
      },
    ],
  });

  const staticStyles: BaseStyles[] = [];
  const themedStyles: Array<Promise<undefined | BaseStyles | BaseStyles[]>> = [];
  let changed = lastThemeRef.current !== currentThemeId || filteredStyles.length !== stylesRef.current.length;
  for (let i = 0; !changed && i < filteredStyles.length; i++) {
    changed = stylesRef.current[i] !== filteredStyles[i];
  }

  if (changed) {
    stylesRef.current = filteredStyles;
    lastThemeRef.current = currentThemeId;

    for (const style of filteredStyles) {
      let data: ClassCollection<Record<string, string>> | Promise<undefined | BaseStyles | BaseStyles[]> | undefined;

      if (typeof style === 'object') {
        data = style;
      } else {
        if (currentThemeId !== undefined) {
          if (!stylesCache.get(currentThemeId).has(style)) {
            data = style(currentThemeId);
            stylesCache.get(currentThemeId).set(style, style(currentThemeId));
          } else {
            data = stylesCache.get(currentThemeId).get(style)!;
          }
        }
      }

      if (data instanceof Promise) {
        themedStyles.push(data);
      } else if (data !== undefined) {
        staticStyles.push(data);
      }
    }
    loadedStyles.current = staticStyles.flat(Infinity);
  }

  useEffect(() => {
    if (changed && themedStyles.length > 0) {
      Promise.all(themedStyles).then(styles => {
        loadedStyles.current = [staticStyles, styles].flat(Infinity).filter(Boolean) as BaseStyles[];
        forceUpdate(patch + 1);
      });
    }
  });

  const styles = useMemo(() => combineStyles(loadedStyles.current), [patch, loadedStyles.current]);

  return styles as ExtractStyles<T>; // todo this method is called in each rerender
}

export function combineStyles(styles: BaseStyles[]): BaseStyles {
  const combined: BaseStyles = {};

  for (const style of styles) {
    for (const [key, value] of Object.entries(style)) {
      combined[key] = [combined[key] || '', value].join(' ').trim();
    }
  }

  return combined;
}
