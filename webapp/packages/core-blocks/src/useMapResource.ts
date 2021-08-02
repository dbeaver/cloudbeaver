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
import { CachedResourceIncludeArgs, CachedMapResource, CachedMapResourceGetter, ResourceKey, CachedMapResourceValue, CachedMapResourceKey, CachedMapResourceArguments, CachedMapResourceLoader } from '@cloudbeaver/core-sdk';

import { useObjectRef } from './useObjectRef';

interface IActions<
  TKeyArg extends ResourceKey<CachedMapResourceKey<TResource>>,
  TResource extends CachedMapResource<any, any, any>,
  TIncludes
> {
  isActive?: () => Promise<boolean> | boolean;
  onLoad?: (resource: TResource) => Promise<any> | any;
  onData?: (
    data: CachedMapResourceLoader<
    TKeyArg,
    CachedMapResourceKey<TResource>,
    CachedMapResourceValue<TResource>,
    TIncludes
    >,
    resource: TResource,
    prevData: CachedMapResourceLoader<
    TKeyArg,
    CachedMapResourceKey<TResource>,
    CachedMapResourceValue<TResource>,
    TIncludes
    > | undefined,
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
  actions?: TResource extends any ? IActions<TKeyArg, TResource, TIncludes> : never
): IMapResourceResult<TKeyArg, TResource, TIncludes> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resource = ctor instanceof CachedMapResource ? ctor : useService(ctor);
  const notifications = useService(NotificationService);
  const [exception, setException] = useState<Error | null>(null);
  let key: TKeyArg | null = keyObj as TKeyArg;
  let includes: TIncludes = [] as TIncludes;

  if (isKeyWithIncludes<TKeyArg, TIncludes>(keyObj)) {
    key = keyObj.key;
    includes = keyObj.includes;
  }

  const refObj = useObjectRef({
    loading: false,
    resource,
    key,
    exception,
    includes,
    actions,
    prevData: undefined as CachedMapResourceLoader<
    TKeyArg,
    CachedMapResourceKey<TResource>,
    CachedMapResourceValue<TResource>,
    TIncludes
    > | undefined,
    load: () => {},
  }, {
    resource,
    key,
    exception,
    includes,
    actions,
  });

  const outdated = resource.isOutdated(key);

  refObj.load = async function load() {
    const { loading, resource, actions, prevData } = refObj;

    const active = await actions?.isActive?.();

    if (loading || active === false) {
      return;
    }

    this.loading = true;

    try {
      await actions?.onLoad?.(resource);

      if (key === null) {
        return;
      }

      const newData = await resource.load(key, includes as any);

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
    } finally {
      this.loading = false;
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

      return resource.isLoaded(refObj.key, refObj.includes as any);
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
  }, [key, includes, outdated]);

  return result;
}

function isKeyWithIncludes<TKey, TIncludes>(obj: any): obj is KeyWithIncludes<TKey, TIncludes> {
  return obj && typeof obj === 'object' && 'includes' in obj && 'key' in obj;
}
