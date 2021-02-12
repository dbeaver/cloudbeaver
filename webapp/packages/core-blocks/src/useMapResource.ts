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

interface IMapResourceResult<
  TKeyArg extends ResourceKey<CachedMapResourceKey<TResource>>,
  TResource extends CachedMapResource<any, any>
> {
  data: CachedMapResourceGetter<TKeyArg, CachedMapResourceKey<TResource>, CachedMapResourceValue<TResource>>;
  resource: TResource;
  isLoading: () => boolean;
}

export function useMapResource<
  TResource extends CachedMapResource<any, any>,
  TKeyArg extends ResourceKey<CachedMapResourceKey<TResource>>,
>(
  ctor: IServiceConstructor<TResource>,
  key: TKeyArg | null,
  actions?: IActions<TResource>
): IMapResourceResult<TKeyArg, TResource> {
  const resource = useService(ctor);
  const notifications = useService(NotificationService);

  const refObj = useObjectRef({
    resource,
    key,
    actions,
    prevData: (isResourceKeyList(key) ? [] : undefined) as CachedMapResourceValue<TResource>,
  }, {
    resource,
    key,
    actions,
  });

  const [result] = useState<IMapResourceResult<TKeyArg, TResource>>(() => ({
    get resource() {
      return refObj.resource;
    },
    get data() {
      if (refObj.key === null) {
        return undefined;
      }

      return resource.get(refObj.key);
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

        const newData = await resource.load(key);

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
  }, [key]);

  return result;
}
