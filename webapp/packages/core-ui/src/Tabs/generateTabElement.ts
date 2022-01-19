/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ITabInfo } from './TabsContainer/ITabsContainer';

export function generateTabElement<TProps = void>(
  generator: (tabInfo: ITabInfo<TProps>, generatorId: string) => JSX.Element,
  props?: TProps,
): (tabInfo: ITabInfo<TProps>) => JSX.Element[] {
  return tabInfo => {
    if (tabInfo.generator) {
      return tabInfo
        .generator(tabInfo.key, props)
        .map(key => generator(tabInfo, key));
    }

    return [generator(tabInfo, tabInfo.key)];
  };
}
