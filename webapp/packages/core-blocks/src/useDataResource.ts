/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useState } from 'react';

import { IServiceConstructor, useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedDataResource, CachedDataResourceContext, CachedDataResourceGetter, CachedDataResourceParam, CachedResourceData, CachedResourceIncludeArgs, isResourceKeyList } from '@cloudbeaver/core-sdk';

import type { ILoadableState } from './Loader/Loader';
import { useObjectRef } from './useObjectRef';

interface KeyWithIncludes<TKey, TIncludes> {
  key: TKey | null;
  includes: TIncludes;
}

interface IActions<TResource> {
  active?: boolean;
  isActive?: (resource: TResource) => Promise<boolean> | boolean;
  onLoad?: (resource: TResource) => Promise<any> | any;
  onData?: (
    data: CachedResourceData<TResource>,
    resource: TResource,
    prevData: CachedResourceData<TResource> | undefined,
  ) => Promise<any> | any;
  onError?: (exception: Error) => void;
}

interface IMapResourceResult<
  TResource,
  TIncludes
> extends ILoadableState {
  data: CachedDataResourceGetter<CachedResourceData<TResource>, TIncludes>;
  resource: TResource;
  exception: Error | null;
  reload: () => void;
}

export function useDataResource<
  TResource,
  TKeyArg extends CachedDataResourceParam<TResource>,
  TIncludes extends CachedResourceIncludeArgs<
  CachedResourceData<TResource>,
  CachedDataResourceContext<TResource>
  > = []
>(
  component: React.FC<any>,
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any
    ? TKeyArg | null | KeyWithIncludes<TKeyArg, TIncludes>
    : never,
  actions?: IActions<TResource>
): IMapResourceResult<TResource, TIncludes>;

export function useDataResource<
  TResource extends CachedDataResource<any, any, any, any>,
  TKeyArg extends CachedDataResourceParam<TResource>,
  TIncludes extends CachedResourceIncludeArgs<
  CachedResourceData<TResource>,
  CachedDataResourceContext<TResource>
  > = []
>(
  component: React.FC<any>,
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any
    ? TKeyArg | null | KeyWithIncludes<TKeyArg, TIncludes>
    : never,
  actions?: IActions<TResource>
): IMapResourceResult<TResource, TIncludes> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resource = ctor instanceof CachedDataResource ? ctor : useService(ctor);
  const notifications = useService(NotificationService);
  const [exception, setException] = useState<Error | null>(null);
  let key: TKeyArg | null = keyObj as TKeyArg;
  let includes: TIncludes = [] as unknown as TIncludes;
  const [loadFunctionName] = useState(`${component.name}.useDataResource(${resource.getName()}).load`);

  if (isKeyWithIncludes<TKeyArg, TIncludes>(keyObj)) {
    key = keyObj.key;
    includes = keyObj.includes;
  }

  // TODO: getComputed skips update somehow ...
  const outdated = (
    (resource.isOutdated(key) || !resource.isLoaded(key, includes as any))
    && !resource.isDataLoading(key)
  );

  const refObj = useObjectRef(() => ({
    loading: false,
    firstRender: true,
    prevData: (isResourceKeyList(key) ? [] : undefined) as CachedResourceData<TResource> | undefined,
    async [loadFunctionName](refresh?: boolean) {
      const { key, includes, loading, resource, actions, prevData } = this;

      if (loading || actions?.active === false) {
        return;
      }

      try {
        const active = await actions?.isActive?.(resource);

        if (active === false) {
          return;
        }

        this.firstRender = false;
        this.loading = true;

        await actions?.onLoad?.(resource);

        if (key === null) {
          return;
        }

        if (refresh) {
          resource.markOutdated(key);
        }

        const newData = await resource.load(key, includes as any);
        setException(null);

        try {
          await actions?.onData?.(
            newData,
            resource,
            prevData
          );
        } finally {
          this.prevData = newData;
        }
      } catch (exception: any) {
        if (resource.getException(key) === null) {
          setException(exception);
        }
        actions?.onError?.(exception);

        if (!this.exceptionObserved) {
          notifications.logException(exception, 'Can\'t load data');
        }
      } finally {
        this.loading = false;
      }
    },
  }), {
    exceptionObserved: false,
    resource,
    key,
    exception,
    includes,
    actions,
  });

  const [result] = useState<IMapResourceResult<TResource, TIncludes>>(() => ({
    get resource() {
      return refObj.resource;
    },
    get exception() {
      refObj.exceptionObserved = true;
      return refObj.exception || resource.getException(refObj.key);
    },
    get data() {
      return refObj.resource.data;
    },
    isLoaded: () => {
      if (refObj.key === null) {
        return false;
      }

      return refObj.resource.isLoaded(refObj.key, refObj.includes as any);
    },
    reload: () => {
      setException(null);
      (refObj as any)[loadFunctionName](true);
    },
    isLoading: () => {
      if (refObj.key === null) {
        return false;
      }

      if (refObj.key === undefined) {
        return refObj.resource.isLoading();
      }

      return refObj.resource.isDataLoading(refObj.key);
    },
  }));

  useEffect(() => {
    if ((!outdated && !refObj.firstRender) || refObj.key === null) {
      return;
    }

    if (result.exception === null) {
      (refObj as any)[loadFunctionName]();
    }
  });

  return result;
}

function isKeyWithIncludes<TKey, TIncludes>(obj: any): obj is KeyWithIncludes<TKey, TIncludes> {
  return obj && typeof obj === 'object' && 'includes' in obj && 'key' in obj;
}
