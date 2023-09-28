/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { BaseStyles, ClassCollection, ComponentStyle, Style, ThemeSelector, ThemeService } from '@cloudbeaver/core-theming';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { useExecutor } from './useExecutor';

const stylesCache = new MetadataMap<string, Map<ThemeSelector<any>, Promise<undefined | BaseStyles | BaseStyles[]>>>(() => new Map());

/**
 * Changes styles depending on theme
 *
 * @param componentStyles styles array
 * @deprecated use useS and css-modules instead
 */
export function useStyles(...componentStyles: ComponentStyle[]): Record<string, any> {
  // todo do you understand that we store ALL STYLES in each component that uses this hook?

  const [, forceUpdate] = useState(0);
  const stylesRef = useRef<ComponentStyle[]>([]);
  const loadedStyles = useRef<BaseStyles[]>([]);
  const themeService = useService(ThemeService);
  const [currentThemeId, setCurrentThemeId] = useState(() => themeService.currentThemeId);
  const lastThemeRef = useRef<string>(currentThemeId);
  //@ts-ignore
  const filteredStyles = componentStyles.flat(Infinity).filter(Boolean) as Style[];
  const trackTheme = filteredStyles.some(style => typeof style === 'function');

  useExecutor({
    executor: themeService.onChange,
    handlers: [
      function updateThemeId(theme) {
        if (currentThemeId !== themeService.currentThemeId && trackTheme) {
          setCurrentThemeId(theme.id);
        }
      },
    ],
  });

  const themedStyles: Array<Promise<undefined | BaseStyles | BaseStyles[]>> = [];
  const staticStyles: BaseStyles[] = [];
  let changed = lastThemeRef.current !== currentThemeId || filteredStyles.length !== stylesRef.current.length;
  for (let i = 0; !changed && i < filteredStyles.length; i++) {
    changed = stylesRef.current[i] !== filteredStyles[i];
  }

  if (changed) {
    stylesRef.current = filteredStyles;
    lastThemeRef.current = currentThemeId;

    for (const style of filteredStyles) {
      let data: ClassCollection<Record<string, string>> | Promise<undefined | BaseStyles | BaseStyles[]>;

      if (typeof style === 'object') {
        data = style;
      } else {
        if (!stylesCache.get(currentThemeId).has(style)) {
          data = style(currentThemeId);
          stylesCache.get(currentThemeId).set(style, style(currentThemeId));
        } else {
          data = stylesCache.get(currentThemeId).get(style)!;
        }
      }

      if (data instanceof Promise) {
        themedStyles.push(data);
      } else {
        staticStyles.push(data);
      }
    }
    loadedStyles.current = staticStyles.flat(Infinity);
  }

  useEffect(() => {
    if (changed && themedStyles.length > 0) {
      Promise.all(themedStyles).then(styles => {
        loadedStyles.current = [staticStyles, styles].flat(Infinity).filter(Boolean) as BaseStyles[];
        forceUpdate(i => i + 1);
      });
    }
  });

  const styles = useMemo(() => create(loadedStyles.current), [loadedStyles.current]);

  return styles; // todo this method is called in each rerender
}

export function joinStyles(...styles: ComponentStyle[]): ComponentStyle {
  //@ts-ignore
  return styles.flat(Infinity) as ComponentStyle;
}
