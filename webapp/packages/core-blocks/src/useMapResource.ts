/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useEffect, useState } from 'react';

import { IServiceConstructor, useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedResourceIncludeArgs, CachedMapResource, CachedMapResourceGetter, ResourceKey, CachedMapResourceValue, CachedMapResourceKey, CachedMapResourceArguments, CachedMapResourceLoader, ResourceKeyList, CachedMapResourceListGetter, isResourceKeyList } from '@cloudbeaver/core-sdk';

import type { ILoadableState } from './Loader/Loader';
import { useObjectRef } from './useObjectRef';
import { useObservableRef } from './useObservableRef';

interface IActions<
  TKeyArg extends ResourceKey<CachedMapResourceKey<TResource>>,
  TResource extends CachedMapResource<any, any, any>,
  TIncludes
> {
  active?: boolean;
  isActive?: (resource: TResource) => Promise<boolean> | boolean;
  onLoad?: (resource: TResource) => Promise<boolean | void> | boolean | void;
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
  preload?: Array<IMapResourceState<any>>;
}

interface KeyWithIncludes<TKey, TIncludes> {
  key: TKey | null;
  includes: TIncludes;
}

interface IMapResourceState<TResource extends CachedMapResource<any, any, any>> extends ILoadableState {
  resource: TResource;
  isOutdated: () => boolean;
}

interface IMapResourceListResult<
  TResource extends CachedMapResource<any, any, any>,
  TIncludes
> extends IMapResourceState<TResource> {
  data: CachedMapResourceListGetter<
  CachedMapResourceValue<TResource>,
  TIncludes
  >;
  exception: Error[] | null;
}

interface IMapResourceResult<
  TResource extends CachedMapResource<any, any, any>,
  TIncludes
> extends IMapResourceState<TResource> {
  data: CachedMapResourceGetter<
  CachedMapResourceValue<TResource>,
  TIncludes
  >;
  exception: Error | null;
}

export function useMapResource<
  TResource extends CachedMapResource<any, any, any>,
  TIncludes extends CachedResourceIncludeArgs<
  CachedMapResourceValue<TResource>,
  CachedMapResourceArguments<TResource>
  > = []
>(
  component: { name: string },
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any
    ? CachedMapResourceKey<TResource> | null | KeyWithIncludes<CachedMapResourceKey<TResource>, TIncludes>
    : never,
  actions?: TResource extends any ? IActions<CachedMapResourceKey<TResource>, TResource, TIncludes> : never
): IMapResourceResult<TResource, TIncludes>;

export function useMapResource<
  TResource extends CachedMapResource<any, any, any>,
  TIncludes extends CachedResourceIncludeArgs<
  CachedMapResourceValue<TResource>,
  CachedMapResourceArguments<TResource>
  > = []
>(
  component: { name: string },
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any
    ? (
      ResourceKeyList<CachedMapResourceKey<TResource>>
      | null
      | KeyWithIncludes<ResourceKeyList<CachedMapResourceKey<TResource>>, TIncludes>
    )
    : never,
  actions?: TResource extends any
    ? IActions<ResourceKeyList<CachedMapResourceKey<TResource>>, TResource, TIncludes>
    : never
): IMapResourceListResult<TResource, TIncludes>;

export function useMapResource<
  TResource extends CachedMapResource<any, any, any>,
  TKeyArg extends ResourceKey<CachedMapResourceKey<TResource>>,
  TIncludes extends CachedResourceIncludeArgs<
  CachedMapResourceValue<TResource>,
  CachedMapResourceArguments<TResource>
  > = []
>(
  component: { name: string },
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any ? TKeyArg | null | KeyWithIncludes<TKeyArg, TIncludes> : never,
  actions?: TResource extends any ? IActions<TKeyArg, TResource, TIncludes> : never
): IMapResourceResult<TResource, TIncludes> | IMapResourceListResult<TResource, TIncludes> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resource = ctor instanceof CachedMapResource ? ctor : useService(ctor);
  const notifications = useService(NotificationService);
  const [exception, setException] = useState<Error | null>(null);
  let key: TKeyArg | null = keyObj as TKeyArg;
  let includes: TIncludes = [] as unknown as TIncludes;
  const [loadFunctionName] = useState(`${component.name}.useMapResource(${resource.getName()}).load`);

  if (isKeyWithIncludes<TKeyArg, TIncludes>(keyObj)) {
    key = keyObj.key;
    includes = keyObj.includes;
  }

  const keyRef = useObjectRef(() => ({
    loadedKey: null as TKeyArg | null,
    get actual() {
      if (this.loadedKey === this.key) {
        return true;
      }

      return resource.isKeyEqual(this.loadedKey, this.key);
    },
  }), { key });

  if (key === null) {
    keyRef.loadedKey = null;
  }

  const refObj = useObservableRef(() => ({
    loading: false,
    prevData: undefined as CachedMapResourceLoader<
    TKeyArg,
    CachedMapResourceKey<TResource>,
    CachedMapResourceValue<TResource>,
    TIncludes
    > | undefined,
    get preloaded(): boolean {
      if (this.actions?.preload) {
        for (const preload of this.actions.preload) {
          if (
            !preload.isLoaded()
            || preload.isOutdated()
            || (
              Array.isArray(preload.exception)
                ? preload.exception.some(Boolean)
                : !!preload.exception
            )
          ) {
            return false;
          }
        }
      }
      return true;
    },
    async [loadFunctionName](refresh?: boolean) {
      const { resource, actions, prevData, key, includes } = this;

      if (this.loading) {
        return;
      }

      try {
        const active = await actions?.isActive?.(resource);

        if (active === false || actions?.active === false) {
          return;
        }

        keyRef.loadedKey = key;
        this.loading = true;

        const prevent = await actions?.onLoad?.(resource);

        if (key === null || prevent === true) {
          setException(null);
          return;
        }

        if (refresh) {
          resource.markOutdated(key);
        }

        const newData = await resource.load(key, includes as any);
        this.prevData = newData;

        await actions?.onData?.(
          newData,
          resource,
          prevData as any  // TODO: fix type error
        );
        setException(null);
      } catch (exception: any) {
        const resourceException = resource.getException(key);

        if (
          !resourceException
          || (
            Array.isArray(resourceException) && !resourceException.some(Boolean)
          )
        ) {
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
    loading: observable.ref,
  }, {
    exceptionObserved: false,
    resource,
    key,
    exception,
    includes,
    actions,
  });

  // TODO: getComputed skips update somehow ...
  const outdated = (
    (resource.isOutdated(key) || !resource.isLoaded(key, includes as any))
    && !resource.isDataLoading(key)
  );

  const [result] = useState<
  IMapResourceResult<TResource, TIncludes>
  | IMapResourceListResult<TResource, TIncludes>
  >(() => ({
    get resource() {
      return refObj.resource;
    },
    get exception() {
      refObj.exceptionObserved = true;
      return refObj.exception || resource.getException(refObj.key);
    },
    get data() {
      if (refObj.key === null || !resource.isLoaded(refObj.key, refObj.includes as any)) {
        if (isResourceKeyList(refObj.key)) {
          return [];
        }

        return undefined;
      }

      return resource.get(refObj.key);
    },
    isOutdated: () => {
      if (refObj.key === null || !refObj.preloaded) {
        return true;
      }

      return resource.isOutdated(refObj.key);
    },
    isLoaded() {
      if (refObj.key === null) {
        return true;
      }

      if (
        Array.isArray(this.exception)
          ? this.exception.some(Boolean)
          : !!this.exception
      ) {
        return false;
      }

      return resource.isLoaded(refObj.key, refObj.includes as any);
    },
    reload: () => {
      (refObj as any)[loadFunctionName](true);
    },
    isLoading: () => {
      if (refObj.key === null) {
        return false;
      }

      return refObj.loading || resource.isDataLoading(refObj.key);
    },
  }));

  const preloaded = refObj.preloaded; // make mobx subscription

  useEffect(() => {
    if (!preloaded || (!outdated && keyRef.actual) || refObj.key === null) {
      return;
    }

    if (result.exception === null || (Array.isArray(result.exception) && !result.exception.some(Boolean))) {
      (refObj as any)[loadFunctionName]();
    }
  });

  return result;
}

function isKeyWithIncludes<TKey, TIncludes>(obj: any): obj is KeyWithIncludes<TKey, TIncludes> {
  return obj && typeof obj === 'object' && 'includes' in obj && 'key' in obj;
}
