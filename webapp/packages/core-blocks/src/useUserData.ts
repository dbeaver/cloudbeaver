/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useRef } from 'react';

import { UserDataService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';

import { useResource } from './ResourcesHooks/useResource.js';
import { useObjectRef } from './useObjectRef.js';

export function useUserData<T extends Record<any, any>>(
  key: string,
  defaultValue: () => T,
  onUpdate?: (data: T) => void,
  validate?: (data: T) => boolean,
): T {
  const optionsRef = useObjectRef({ defaultValue, onUpdate, validate });
  useResource(useUserData, UserInfoResource, undefined);
  const userDataService = useService(UserDataService);
  const ref = useRef<T | null>(null);
  const data = userDataService.getUserData(key, defaultValue, validate);

  useEffect(() => {
    if (ref.current !== data) {
      ref.current = data;
      optionsRef.onUpdate?.(data);
    }
  }, [ref.current, data]);

  return data;
}
