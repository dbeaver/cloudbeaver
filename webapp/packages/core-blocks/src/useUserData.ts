/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef } from 'react';

import { UserDataService } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';

export function useUserData<T>(
  key: string,
  defaultValue: () => T,
  onUpdate?: (data: T) => void,
  validate?: (data: T) => boolean
): T {
  const userDataService = useService(UserDataService);
  const ref = useRef<T | null>(null);
  const data = userDataService.getUserData(key, defaultValue, validate);
  const previous = ref.current;
  ref.current = data;

  useEffect(() => {
    if (previous !== data) {
      onUpdate?.(data);
    }
  });

  return data;
}
