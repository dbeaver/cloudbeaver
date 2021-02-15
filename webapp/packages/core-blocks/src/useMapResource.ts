/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useState } from 'react';

import { IServiceConstructor, useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapResource, CachedMapResourceGetter, isResourceKeyList, ResourceKey } from '@cloudbeaver/core-sdk';

import { useObjectRef } from './useObjectRef';

export type CachedMapResourceKey<T> = T extends CachedMapResource<infer TKey, any> ? TKey : never;
export type CachedMapResourceValue<T> = T extends CachedMapResource<any, infer TValue> ? TValue : never;

interface IActions<TResource> {
  onLoad?: (resource: TResource) => Promise<any> | any;
  onData?: (
    data: CachedMapResourceValue<TResource>,
    resource: TResource,
    prevData: CachedMapResourceValue<TResource>,
  ) => Promise<any> | any;
}

interface KeyWithIncludes<TKey, TIncludes> {
  key: TKey | null;
  includes: TIncludes;
}

interface IMapResourceResult<
  TKeyArg extends ResourceKey<CachedMapResourceKey<TResource>>,
  TResource extends CachedMapResource<any, any>,
  TIncludes extends Array<keyof CachedMapResourceValue<TResource>>
> {
  data: CachedMapResourceGetter<TKeyArg, CachedMapResourceKey<TResource>, CachedMapResourceValue<TResource>, TIncludes>;
  resource: TResource;
  isLoading: () => boolean;
  isLoaded: () => boolean;
}

export function useMapResource<
  TResource extends CachedMapResource<any, any>,
  TKeyArg extends ResourceKey<CachedMapResourceKey<TResource>>,
  TIncludes extends Array<keyof CachedMapResourceValue<TResource>> = []
>(
  ctor: IServiceConstructor<TResource>,
  keyObj: TKeyArg | null | KeyWithIncludes<TKeyArg, TIncludes>,
  actions?: IActions<TResource>
): IMapResourceResult<TKeyArg, TResource, TIncludes> {
  const resource = useService(ctor);
  const notifications = useService(NotificationService);
  const key = keyObj && typeof keyObj === 'object' && 'includes' in keyObj ? keyObj.key : keyObj;
  const includes = keyObj && typeof keyObj === 'object' && 'includes' in keyObj ? keyObj.includes : [];

  const refObj = useObjectRef({
    resource,
    key,
    includes,
    actions,
    prevData: (isResourceKeyList(key) ? [] : undefined) as CachedMapResourceValue<TResource>,
  }, {
    resource,
    key,
    includes,
    actions,
  });

  const [result] = useState<IMapResourceResult<TKeyArg, TResource, TIncludes>>(() => ({
    get resource() {
      return refObj.resource;
    },
    get data() {
      if (refObj.key === null) {
        return undefined;
      }

      return resource.get(refObj.key);
    },
    isLoaded: () => {
      if (refObj.key === null) {
        return false;
      }

      return resource.isLoaded(refObj.key, refObj.includes);
    },
    isLoading: () => {
      if (refObj.key === null) {
        return false;
      }

      return resource.isDataLoading(refObj.key);
    },
  }));

  useEffect(() => {
    (async () => {
      const { resource, actions, prevData } = refObj;

      try {
        await actions?.onLoad?.(resource);

        if (key === null) {
          return;
        }

        const newData = await resource.load(key, includes);

        try {
          await actions?.onData?.(
            newData,
            resource,
            prevData
          );
        } finally {
          refObj.prevData = newData;
        }
      } catch (exception) {
        notifications.logException(exception, 'Can\'t load data');
      }
    })();
  }, [key, includes]);

  return result;
}
