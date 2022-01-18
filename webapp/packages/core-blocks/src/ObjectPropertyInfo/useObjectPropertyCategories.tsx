/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, IComputedValue } from 'mobx';
import { useMemo } from 'react';

import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

interface ICategoriesInfo {
  categories: string[];
  isUncategorizedExists: boolean;
}

export function useObjectPropertyCategories(properties: ObjectPropertyInfo[]) {
  const categories: IComputedValue<ICategoriesInfo> = useMemo(() => computed(() => {
    const result: ICategoriesInfo = {
      categories: [],
      isUncategorizedExists: false,
    };

    for (const property of properties) {
      const category = property.category;
      if (!category) {
        result.isUncategorizedExists = true;
        continue;
      }

      if (!result.categories.includes(category)) {
        result.categories.push(category);
      }
    }

    return result;
  }), [properties]);

  return categories.get();
}
