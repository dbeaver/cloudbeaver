/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable, untracked } from 'mobx';
import { useEffect, useState } from 'react';

import { IServiceConstructor, useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedResourceIncludeArgs, CachedMapResource, CachedMapResourceGetter, ResourceKey, CachedMapResourceValue, CachedMapResourceKey, CachedMapResourceArguments, CachedMapResourceLoader, ResourceKeyList, CachedMapResourceListGetter, isResourceKeyList } from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import type { ILoadableState } from './Loader/ILoadableState';
import { useObservableRef } from './useObservableRef';

interface IActions<
  TKeyArg extends ResourceKey<CachedMapResourceKey<TResource>>,
  TResource extends CachedMapResource<any, any, any>,
  TIncludes
> {
  active?: boolean;
  isActive?: (resource: TResource) => Promise<boolean> | boolean;
  onLoad?: (resource: TResource, key: TKeyArg | null) => Promise<boolean | void> | boolean | void;
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
  outdated: boolean;
  loading: boolean;
  loaded: boolean;
  resource: TResource;
  isOutdated: () => boolean;
  reload: () => void;
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

  const keyRef = useObservableRef(() => ({
    key,
    includes,
    loadedKey: null as TKeyArg | null,
    get actual() {
      if (this.loadedKey === this.key) {
        return true;
      }

      if (this.loadedKey === null || this.key === null) {
        return false;
      }

      return untracked(() => resource.includes(this.loadedKey, this.key));
    },
  }), {
    loadedKey: observable.ref,
    key: observable.ref,
    includes: observable.ref,
    actual: computed,
  }, false);

  if (key === null && key !== keyRef.key) {
    untracked(() => {
      keyRef.key = null;
      keyRef.loadedKey = null;
    });
  }

  if (!isArraysEqual(includes, keyRef.includes)) {
    untracked(() => {
      keyRef.includes = includes;
    });
  }

  untracked(() => {
    if (
      key === null
      || keyRef.key === null
      || !resource.includes(key, keyRef.key)
    ) {
      keyRef.key = key;
    }
  });

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
      const { resource, actions, prevData } = this;
      const key = keyRef.key;
      const includes = keyRef.includes;

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

        const prevent = await actions?.onLoad?.(resource, key);

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
    preloaded: computed,
    exception: observable.ref,
    loading: observable.ref,
  }, {
    exceptionObserved: false,
    resource,
    exception,
    actions,
  });

  const result = useObservableRef<
  IMapResourceResult<TResource, TIncludes>
  | IMapResourceListResult<TResource, TIncludes>
  >(() => ({
    get resource() {
      return refObj.resource;
    },
    get exception() {
      refObj.exceptionObserved = true;

      if (refObj.exception) {
        return refObj.exception;
      }

      if (keyRef.key === null) {
        return null;
      }

      return refObj.resource.getException(keyRef.key);
    },
    get data() {
      if (keyRef.key === null || !refObj.resource.isLoaded(keyRef.key, keyRef.includes as any)) {
        if (isResourceKeyList(keyRef.key)) {
          return [];
        }

        return undefined;
      }

      return refObj.resource.get(keyRef.key);
    },
    get outdated() {
      if (keyRef.key === null || !refObj.preloaded) {
        return true;
      }

      return refObj.resource.isOutdated(keyRef.key);
    },
    get loaded() {
      if (keyRef.key === null) {
        return true;
      }

      if (
        Array.isArray(this.exception)
          ? this.exception.some(Boolean)
          : !!this.exception
      ) {
        return false;
      }

      return refObj.resource.isLoaded(keyRef.key, keyRef.includes as any);
    },
    get loading() {
      if (keyRef.key === null) {
        return false;
      }

      return refObj.loading || refObj.resource.isDataLoading(keyRef.key);
    },
    isOutdated() {
      return this.outdated;
    },
    isLoaded() {
      return this.loaded;
    },
    reload: () => {
      (refObj as any)[loadFunctionName](true);
    },
    isLoading() {
      return this.loading;
    },
  }), {
    exception: computed,
    data: computed,
    outdated: computed,
    loaded: computed,
    loading: computed,
  }, false);

  // TODO: getComputed skips update somehow ...
  const outdated = (
    !result.loading
    && (result.outdated || !result.loaded)
  );

  const preloaded = refObj.preloaded; // make mobx subscription

  useEffect(() => {
    if (!preloaded || (!outdated && keyRef.actual) || keyRef.key === null) {
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
