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
import { CachedResourceIncludeArgs, CachedMapResource, CachedMapResourceGetter, isResourceKeyList, ResourceKey, CachedMapResourceValue, CachedMapResourceKey, CachedMapResourceArguments } from '@cloudbeaver/core-sdk';

import { useObjectRef } from './useObjectRef';

interface IActions<TResource extends CachedMapResource<any, any, any>> {
  onLoad?: (resource: TResource) => Promise<any> | any;
  onData?: (
    data: CachedMapResourceValue<TResource>,
    resource: TResource,
    prevData: CachedMapResourceValue<TResource> | undefined,
  ) => Promise<any> | any;
  onError?: (exception: Error) => void;
}

interface KeyWithIncludes<TKey, TIncludes> {
  key: TKey | null;
  includes: TIncludes;
}

interface IMapResourceResult<
  TKeyArg extends ResourceKey<CachedMapResourceKey<TResource>>,
  TResource extends CachedMapResource<any, any, any>,
  TIncludes
> {
  data: CachedMapResourceGetter<TKeyArg, CachedMapResourceKey<TResource>, CachedMapResourceValue<TResource>, TIncludes>;
  resource: TResource;
  exception: Error | null;
  isLoading: () => boolean;
  isLoaded: () => boolean;
  reload: () => void;
}

export function useMapResource<
  TResource extends CachedMapResource<any, any, any>,
  TKeyArg extends ResourceKey<CachedMapResourceKey<TResource>>,
  TIncludes extends CachedResourceIncludeArgs<
  CachedMapResourceValue<TResource>,
  CachedMapResourceArguments<TResource>
  > = []
>(
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any ? TKeyArg | null | KeyWithIncludes<TKeyArg, TIncludes> : never,
  actions?: IActions<TResource>
): IMapResourceResult<TKeyArg, TResource, TIncludes> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resource = ctor instanceof CachedMapResource ? ctor : useService(ctor);
  const notifications = useService(NotificationService);
  const [exception, setException] = useState<Error | null>(null);
  const key = keyObj && typeof keyObj === 'object' && 'includes' in keyObj ? keyObj.key : keyObj;
  const includes = keyObj && typeof keyObj === 'object' && 'includes' in keyObj ? keyObj.includes : [];

  const refObj = useObjectRef({
    resource,
    key,
    exception,
    includes,
    actions,
    prevData: (isResourceKeyList(key) ? [] : undefined) as CachedMapResourceValue<TResource> | undefined,
    load: () => {},
  }, {
    resource,
    key,
    exception,
    includes,
    actions,
  });

  refObj.load = async function load() {
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
      setException(exception);
      actions?.onError?.(exception);
      notifications.logException(exception, 'Can\'t load data');
    }
  };

  const [result] = useState<IMapResourceResult<TKeyArg, TResource, TIncludes>>(() => ({
    get resource() {
      return refObj.resource;
    },
    get exception() {
      return refObj.exception;
    },
    get data() {
      if (refObj.key === null) {
        return undefined;
      }

      return resource.get(refObj.key);
    },
    isLoaded: () => {
      if (refObj.key === null) {
        return true;
      }

      return resource.isLoaded(refObj.key, refObj.includes);
    },
    reload: () => {
      setException(null);
      refObj.load();
    },
    isLoading: () => {
      if (refObj.key === null) {
        return false;
      }

      return resource.isDataLoading(refObj.key);
    },
  }));

  useEffect(() => {
    if (exception === null) {
      refObj.load();
    }
  }, [key, includes]);

  return result;
}
