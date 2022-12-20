/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable, toJS, untracked } from 'mobx';
import { useEffect, useState } from 'react';

import { IServiceConstructor, useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapResource, CachedMapResourceGetter, CachedMapResourceValue, CachedMapResourceLoader, ResourceKeyList, CachedMapResourceListGetter, isResourceKeyList, CachedResourceData, CachedDataResourceGetter, CachedResource, CachedDataResource, CachedResourceParam, CachedResourceKey, CachedResourceContext } from '@cloudbeaver/core-sdk';
import { ILoadableState, isArraysEqual, isContainsException } from '@cloudbeaver/core-utils';

import { getComputed } from '../getComputed';
import { useObservableRef } from '../useObservableRef';

interface KeyWithIncludes<TKey, TIncludes> {
  readonly key: TKey | null;
  readonly includes: TIncludes;
}

type ResourceData<
  TResource extends CachedResource<any, any, any, any, any>,
  TKey,
  TIncludes
> = TResource extends CachedDataResource<any, any, any, any>
  ? CachedResourceData<TResource>
  : CachedMapResourceLoader<
  TKey,
  CachedResourceKey<TResource>,
  CachedResourceData<TResource> extends Map<any, infer I> ? I : never,
  TIncludes
  >
;

interface IActions<
  TResource extends CachedResource<any, any, any, any, any>,
  TKey,
  TIncludes
> {
  active?: boolean;
  silent?: boolean;
  isActive?: (resource: TResource) => Promise<boolean> | boolean;
  onLoad?: (
    resource: TResource,
    key: CachedResourceParam<TResource> | null
  ) => Promise<boolean | void> | boolean | void;
  onData?: (
    data: ResourceData<TResource, TKey, TIncludes>,
    resource: TResource,
    prevData: ResourceData<TResource, TKey, TIncludes> | undefined,
  ) => Promise<any> | any;
  onError?: (exception: Error) => void;
  preload?: ILoadableState[];
}

interface IMapResourceState<TResource> extends ILoadableState {
  outdated: boolean;
  loading: boolean;
  loaded: boolean;
  resource: TResource;
  isOutdated: () => boolean;
  load: () => void;
  reload: () => void;
}

interface IMapResourceListResult<TResource, TIncludes> extends IMapResourceState<TResource> {
  data: CachedMapResourceListGetter<
  CachedMapResourceValue<TResource>,
  TIncludes
  >;
  exception: Error[] | null;
}

interface IMapResourceResult<TResource, TIncludes> extends IMapResourceState<TResource> {
  data: CachedMapResourceGetter<
  CachedMapResourceValue<TResource>,
  TIncludes
  >;
  exception: Error | null;
}

interface IDataResourceResult<TResource, TIncludes> extends IMapResourceState<TResource> {
  data: CachedDataResourceGetter<CachedResourceData<TResource>, TIncludes>;
  exception: Error | null;
}

type TResult<TResource, TKey, TIncludes> = (
  TResource extends CachedDataResource<any, any, any, any>
    ? IDataResourceResult<TResource, TIncludes>
    : (
      TKey extends ResourceKeyList<any>
        ? IMapResourceListResult<TResource, TIncludes>
        : IMapResourceResult<TResource, TIncludes>
    )
);

export function useResource<
  TResource extends CachedResource<any, any, any, any, any>,
  TKeyArg extends CachedResourceParam<TResource>,
  TIncludes extends Readonly<CachedResourceContext<TResource>>
>(
  component: { name: string },
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any ? TKeyArg | null | KeyWithIncludes<TKeyArg, TIncludes> : never,
  actions?: TResource extends any ? IActions<TResource, TKeyArg, TIncludes> : never
): TResult<TResource, TKeyArg, TIncludes>;

export function useResource<
  TResource extends CachedResource<any, any, any, any, any>,
  TKeyArg extends CachedResourceParam<TResource>,
  TIncludes extends CachedResourceContext<TResource>
>(
  component: { name: string },
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any ? TKeyArg | null | KeyWithIncludes<TKeyArg, TIncludes> : never,
  actions?: TResource extends any ? IActions<TResource, TKeyArg, TIncludes> : never
): IMapResourceResult<TResource, TIncludes>
  | IMapResourceListResult<TResource, TIncludes>
  | IDataResourceResult<TResource, TIncludes> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resource = ctor instanceof CachedResource ? ctor : useService(ctor);
  const notifications = useService(NotificationService);
  const [exception, setException] = useState<Error | null>(null);
  let key: TKeyArg | null = keyObj as TKeyArg;
  let includes: TIncludes = [] as unknown as TIncludes;
  const [loadFunctionName] = useState(`${component.name}.useResource(${resource.getName()}).load`);

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
    prevData: (isResourceKeyList(key) ? [] : undefined) as unknown | undefined,
    useRef: [null, ''] as [TKeyArg | null, string],
    use(key: TKeyArg | null) {
      key = toJS(key);

      if (this.useRef[0] !== null) {
        if (key !== null && this.resource.includes(key, this.useRef[0])) {
          return;
        }

        resource.free(this.useRef[0], this.useRef[1]);
      }
      this.useRef = [key, key === null ? '' : resource.use(key)];
    },
    get preloaded(): boolean {
      if (this.actions?.preload) {
        for (const preload of this.actions.preload) {
          if (
            !preload.isLoaded()
            || preload.isOutdated?.()
            || preload.isError()
          ) {
            return false;
          }
        }
      }
      return true;
    },
    async [loadFunctionName](refresh?: boolean) {
      const { loading, resource, actions, prevData } = this;
      const key = keyRef.key;
      const includes = keyRef.includes;

      if (loading) {
        return;
      }

      try {
        const active = await actions?.isActive?.(resource);

        if (active === false) {
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

        if (!actions?.silent && !this.exceptionObserved) {
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
    resource: observable.ref,
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

        if (refObj.resource instanceof CachedMapResource) {
          return undefined;
        }
      }

      if (refObj.resource instanceof CachedMapResource) {
        return refObj.resource.get(keyRef.key);
      }
      return refObj.resource.data;
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

      if (this.isError()) {
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
    isError() {
      return isContainsException(this.exception);
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
    load: () => {
      (refObj as any)[loadFunctionName]();
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

  const canLoad = getComputed(() => (
    (
      !keyRef.actual
      || result.outdated
      || !result.loaded
    )
    && refObj.preloaded
    && keyRef.key !== null
    && actions?.active !== false
    && !result.isError()
  ));

  useEffect(() => () => {
    refObj.use(null);
  }, []);

  useEffect(() => {
    refObj.use(key);
    if (canLoad) {
      (refObj as any)[loadFunctionName]();
    }
  });

  // if (canLoad && !refObj.loading) {
  //   throw (refObj as any)[loadFunctionName]();
  // }

  return result;
}

function isKeyWithIncludes<TKey, TIncludes>(obj: any): obj is KeyWithIncludes<TKey, TIncludes> {
  return obj && typeof obj === 'object' && 'includes' in obj && 'key' in obj;
}
