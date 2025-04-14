/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, comparer, computed, observable, reaction, toJS, untracked } from 'mobx';
import { useContext, useDeferredValue, useEffect, useState } from 'react';

import { type IServiceConstructor, useService } from '@cloudbeaver/core-di';
import {
  CachedDataResource,
  type CachedDataResourceGetter,
  CachedMapResource,
  type CachedMapResourceGetter,
  type CachedMapResourceListGetter,
  type CachedMapResourceLoader,
  type CachedMapResourceValue,
  type CachedResourceContext,
  type CachedResourceData,
  type CachedResourceKey,
  type IResource,
  isResourceKeyList,
  isResourceKeyListAlias,
  Resource,
  type ResourceKey,
  ResourceKeyList,
  ResourceKeyListAlias,
} from '@cloudbeaver/core-resource';
import { type ILoadableState, isArraysEqual, isContainsException, LoadingError } from '@cloudbeaver/core-utils';

import { ErrorContext } from '../ErrorContext.js';
import { getComputed } from '../getComputed.js';
import { useObjectRef } from '../useObjectRef.js';
import { useObservableRef } from '../useObservableRef.js';

export interface ResourceKeyWithIncludes<TKey, TIncludes> {
  readonly key: TKey | null;
  readonly includes: TIncludes;
}

type ResourceData<TResource extends IResource<any, any, any, any>, TKey, TIncludes> =
  TResource extends CachedDataResource<any, any, any, any>
    ? CachedResourceData<TResource>
    : CachedMapResourceLoader<TKey, CachedResourceKey<TResource>, CachedResourceData<TResource> extends Map<any, infer I> ? I : never, TIncludes>;

interface IActions<TResource extends IResource<any, any, any, any>, TKey, TIncludes> {
  active?: boolean;
  /** Indicates whether the resource should be loadable without modifying data, unlike the "active" field */
  freeze?: boolean;
  forceSuspense?: boolean;
  silent?: boolean;
  onData?: (data: ResourceData<TResource, TKey, TIncludes>, resource: TResource) => any;
  onError?: (exception: Error | Error[] | null) => void;
}

interface IResourcePrivateState {
  canLoad: boolean;
  preloaded: boolean;
}

interface IMapResourceState<TResource> extends ILoadableState {
  outdated: boolean;
  loading: boolean;
  loaded: boolean;
  resource: TResource;
  isOutdated: () => boolean;
  load: () => Promise<void>;
  reload: () => Promise<void>;
}

interface IMapResourceListResult<TResource, TIncludes> extends IMapResourceState<TResource> {
  data: CachedMapResourceListGetter<CachedMapResourceValue<TResource>, TIncludes>;
  tryGetData: CachedMapResourceListGetter<CachedMapResourceValue<TResource>, TIncludes>;
  exception: Error[] | null;
}

interface IMapResourceResult<TResource, TIncludes> extends IMapResourceState<TResource> {
  data: CachedMapResourceGetter<CachedMapResourceValue<TResource>, TIncludes>;
  tryGetData: CachedMapResourceGetter<CachedMapResourceValue<TResource>, TIncludes>;
  exception: Error | null;
}

interface IDataResourceResult<TResource, TIncludes> extends IMapResourceState<TResource> {
  /**
   * Returns `undefined` or loaded data (observable, suspense)
   */
  data: CachedDataResourceGetter<CachedResourceData<TResource>, TIncludes>;
  /**
   * Returns undefined or loaded data (observable). Accessing this method will not trigger React Suspense.
   */
  tryGetData: CachedDataResourceGetter<CachedResourceData<TResource>, TIncludes>;
  exception: Error | null;
}

type TResult<TResource, TKey, TIncludes> =
  TResource extends CachedDataResource<any, any, any>
    ? IDataResourceResult<TResource, TIncludes>
    : TKey extends ResourceKeyList<any> | ResourceKeyListAlias<any, any>
      ? IMapResourceListResult<TResource, TIncludes>
      : IMapResourceResult<TResource, TIncludes>;

/**
 * Accepts resource class or instance and returns resource state.
 *
 * @param component React Component, React Functional Component, or React Hook
 * @param ctor Resource instance or class
 * @param keyObj `null` (skip resource loading) or any other valid value
 * @param actions
 */
export function useResource<
  TResource extends IResource<any, any, any, any>,
  TKeyArg extends ResourceKey<CachedResourceKey<TResource>>,
  TIncludes extends Readonly<CachedResourceContext<TResource>>,
>(
  component: { name: string },
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any ? TKeyArg | null | ResourceKeyWithIncludes<TKeyArg, TIncludes> : never,
  actions?: TResource extends any ? IActions<TResource, TKeyArg, TIncludes> : never,
): TResult<TResource, TKeyArg, TIncludes>;

export function useResource<
  TResource extends Resource<any, any, any, any>,
  TKeyArg extends ResourceKey<CachedResourceKey<TResource>>,
  TIncludes extends CachedResourceContext<TResource>,
>(
  component: { name: string },
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any ? TKeyArg | null | ResourceKeyWithIncludes<TKeyArg, TIncludes> : never,
  actions?: TResource extends any ? IActions<TResource, TKeyArg, TIncludes> : never,
): IMapResourceResult<TResource, TIncludes> | IMapResourceListResult<TResource, TIncludes> | IDataResourceResult<TResource, TIncludes> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resource = ctor instanceof Resource ? ctor : useService(ctor);
  const unmountedRef = useObjectRef({ unmounted: false });
  const errorContext = useContext(ErrorContext);
  let key: ResourceKey<TKeyArg> | null = keyObj as ResourceKey<TKeyArg>;
  let includes: TIncludes = [] as unknown as TIncludes;
  const [loadFunctionName] = useState(`${component.name}.useResource(${resource.getName()}).load` as const);

  if (isKeyWithIncludes<TKeyArg, TIncludes>(keyObj)) {
    key = keyObj.key;
    includes = keyObj.includes;
  }

  actions = useObjectRef(actions ?? ({} as any));

  const propertiesRef = useObservableRef(
    () => ({
      key,
      includes,
      resource,
      errorContext,
    }),
    {
      key: observable.ref,
      includes: observable.ref,
      resource: observable.ref,
      errorContext: observable.ref,
    },
    false,
  );

  untracked(() => {
    if (!isArraysEqual(includes, propertiesRef.includes)) {
      propertiesRef.includes = includes;
    }

    if (key === null || propertiesRef.key === null || !propertiesRef.resource.isEqual(key, propertiesRef.key)) {
      if (propertiesRef.key !== key) {
        propertiesRef.key = key;
      }
    }
  });

  function getData(): any {
    if (propertiesRef.resource instanceof CachedDataResource) {
      return propertiesRef.resource.data;
    }
    if (propertiesRef.resource instanceof CachedMapResource) {
      if (actions?.active === false || propertiesRef.key === null) {
        if (isResourceKeyList(propertiesRef.key) || isResourceKeyListAlias(propertiesRef.key)) {
          return [];
        }

        return undefined;
      }
      return propertiesRef.resource.get(propertiesRef.key);
    }

    return propertiesRef.resource.data;
  }

  const preloaded = getComputed(() => {
    if (actions?.active === false) {
      return false;
    }
    return true;
  });

  const refObj = useObservableRef(
    () => ({
      loadingPromise: null as Promise<void> | null,
      exception: null as Error | null,
      useRef: [null, ''] as [ResourceKey<TKeyArg> | null, string],
      get resourceException(): Error | null {
        if (propertiesRef.key === null) {
          return null;
        }

        return propertiesRef.resource.getException(propertiesRef.key);
      },
      isResourceError(): boolean {
        return isContainsException(this.resourceException);
      },
      use(key: ResourceKey<TKeyArg> | null): void {
        key = toJS(key);

        if (this.useRef[0] !== null && propertiesRef.resource.useTracker.hasUseId(this.useRef[1])) {
          if (key !== null && propertiesRef.resource.isEqual(key, this.useRef[0])) {
            return;
          }

          propertiesRef.resource.useTracker.free(this.useRef[0], this.useRef[1]);
        }
        this.useRef = [key, key === null ? '' : propertiesRef.resource.useTracker.use(key)];
      },
      async [loadFunctionName](refresh?: boolean): Promise<void> {
        const { key, includes, resource } = propertiesRef;

        if (refresh) {
          await resource.refresh(key, includes as any);
        } else {
          await resource.load(key, includes as any);
        }
      },
      async load(refresh?: boolean): Promise<void> {
        if (propertiesRef.key === null || unmountedRef.unmounted) {
          return;
        }

        let loadingPromise: Promise<void> | null = null;

        try {
          loadingPromise = (this[loadFunctionName] as (refresh?: boolean) => Promise<void>)(refresh);
          this.loadingPromise = loadingPromise;
          await loadingPromise;
          if (this.loadingPromise !== loadingPromise) {
            return;
          }
          this.exception = null;
        } catch (exception: any) {
          console.error(exception);
          if (this.loadingPromise !== loadingPromise) {
            return;
          }
          if (actions?.silent !== true && propertiesRef.errorContext) {
            if (this.isResourceError()) {
              const errors = Array.isArray(this.resourceException) ? this.resourceException : [this.resourceException];

              for (const error of errors) {
                if (error) {
                  propertiesRef.errorContext.catch(error);
                }
              }
            } else {
              this.exception = new LoadingError(
                () => {
                  this.exception = null;
                  this.load.bind(this, true);
                },
                'Application is unable to load resource',
                { cause: exception },
              );
              propertiesRef.errorContext.catch(this.exception);
            }
          }
          actions?.onError?.(exception);
        } finally {
          this.loadingPromise = null;
        }
      },
    }),
    {
      load: action,
      resourceException: computed,
      exception: observable.ref,
      loadingPromise: observable.ref,
    },
    false,
  );

  const result = useObservableRef<(IMapResourceResult<TResource, TIncludes> | IMapResourceListResult<TResource, TIncludes>) & IResourcePrivateState>(
    () => ({
      preloaded,
      get canLoad(): boolean {
        if (actions?.freeze) {
          return false;
        }

        return propertiesRef.key !== null && this.preloaded && this.outdated && !this.loading;
      },
      get resource() {
        return propertiesRef.resource;
      },
      get exception() {
        if (propertiesRef.key === null) {
          return null;
        }

        if (refObj.exception) {
          return refObj.exception;
        }

        return refObj.resourceException;
      },
      get tryGetData() {
        if (propertiesRef.key === null && this.resource instanceof CachedMapResource) {
          return undefined;
        }

        return getData();
      },
      get data() {
        if (propertiesRef.key === null && this.resource instanceof CachedMapResource) {
          return undefined;
        }

        // React Suspense block
        // if (refObj.loadingPromise) {
        //   throw refObj.loadingPromise;
        // }

        if (!this.isLoaded()) {
          if (this.loading) {
            throw refObj.load();
          }

          if (this.canLoad) {
            throw refObj.load();
          }

          if (this.isError()) {
            throw this.exception;
          }
        }
        //---------------------

        return getData();
      },
      get outdated(): boolean {
        return (
          propertiesRef.key === null ||
          !this.preloaded ||
          this.loading ||
          !this.loaded ||
          this.resource.isOutdated(propertiesRef.key, propertiesRef.includes)
        );
      },
      get loaded() {
        if (propertiesRef.key === null) {
          return true;
        }

        return this.resource.isLoaded(propertiesRef.key, propertiesRef.includes);
      },
      get loading(): boolean {
        if (propertiesRef.key === null) {
          return false;
        }

        return this.resource.isLoading(propertiesRef.key);
      },
      isError() {
        return isContainsException(this.exception);
      },
      isOutdated(): boolean {
        return this.outdated;
      },
      isLoaded() {
        return this.loaded;
      },
      reload: () => refObj.load(true),
      load: () => refObj.load(),
      isLoading() {
        return this.loading;
      },
    }),
    {
      canLoad: computed,
      exception: computed<any>({
        equals: (a, b) => {
          if (Array.isArray(a) && Array.isArray(b)) {
            return isArraysEqual(a, b, undefined, true);
          }

          return comparer.default(a, b);
        },
      }),
      // TODO: in case when array is mutated, but not replaced, it will not be updated
      // tryGetData: computed<any>({
      //   equals: (a, b) => {
      //     if (Array.isArray(a) && Array.isArray(b)) {
      //       return isArraysEqual(a, b, undefined, true);
      //     }

      //     return comparer.default(a, b);
      //   },
      // }),
      // data: computed<any>({
      //   equals: (a, b) => {
      //     if (Array.isArray(a) && Array.isArray(b)) {
      //       return isArraysEqual(a, b, undefined, true);
      //     }

      //     return comparer.default(a, b);
      //   },
      // }),
      outdated: computed,
      loaded: computed,
      loading: computed,
      preloaded: observable.ref,
    },
    { preloaded },
  );

  useEffect(() => {
    const disposeDataUpdate = reaction(
      () => ({ data: result.tryGetData, loaded: result.loaded }),
      ({ data, loaded }) => {
        if (loaded) {
          actions?.onData?.(data as any, resource);
        }
      },
      {
        onError: () => {},
        fireImmediately: true,
      },
    );
    const disposeErrorUpdate = reaction(
      () => result.exception,
      exception => {
        if (!result.isError()) {
          return;
        }
        if (actions?.silent !== true && propertiesRef.errorContext) {
          const errors = Array.isArray(exception) ? exception : [exception];

          for (const error of errors) {
            if (error) {
              propertiesRef.errorContext.catch(error);
            }
          }
        }
        actions?.onError?.(exception);
      },
      {
        fireImmediately: true,
      },
    );
    return () => {
      disposeDataUpdate();
      disposeErrorUpdate();
      refObj.use(null);
    };
  }, []);

  const canLoad = useDeferredValue(getComputed(() => result.canLoad));
  const loadKey = useDeferredValue(getComputed(() => propertiesRef.key));

  useEffect(() => {
    refObj.use(loadKey);
    if (canLoad) {
      result.load();
    }
  }, [canLoad, loadKey]);

  useEffect(
    () => () => {
      unmountedRef.unmounted = true;
    },
    [],
  );

  if (actions?.forceSuspense) {
    result.data;
  }

  return result;
}

function isKeyWithIncludes<TKey, TIncludes>(obj: any): obj is ResourceKeyWithIncludes<TKey, TIncludes> {
  return obj && typeof obj === 'object' && 'includes' in obj && 'key' in obj;
}
