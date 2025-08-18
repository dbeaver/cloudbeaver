/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext, useEffect, useMemo, useState } from 'react';

import { type IServiceConstructor, useService } from '@cloudbeaver/core-di';
import {
  CachedDataResource,
  type CachedDataResourceGetter,
  CachedMapResource,
  type CachedMapResourceGetter,
  type CachedMapResourceListGetter,
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
import { type ILoadableState, isContainsException, LoadingError } from '@cloudbeaver/core-utils';
import { mutex } from '@dbeaver/js-helpers';

import { ErrorContext } from '../ErrorContext.js';
import { useObjectRef } from '../useObjectRef.js';
import { useResourceTracker } from './useResourceTracker.js';
import { useResourceStableKey, type ResourceKeyWithIncludes } from './useResourceStableKey.js';
import { getComputed } from '../getComputed.js';

interface IActions {
  active?: boolean;
  /** Indicates whether the resource should be loadable without modifying data, unlike the "active" field */
  freeze?: boolean;
  forceSuspense?: boolean;
  silent?: boolean;
}

interface IMapResourceState<TResource> extends ILoadableState {
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
  actions?: IActions,
): TResult<TResource, TKeyArg, TIncludes>;

export function useResource<
  TResource extends Resource<any, any, any, any>,
  TKeyArg extends ResourceKey<CachedResourceKey<TResource>>,
  TIncludes extends CachedResourceContext<TResource>,
>(
  component: { name: string },
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any ? TKeyArg | null | ResourceKeyWithIncludes<TKeyArg, TIncludes> : never,
  actions?: IActions,
): IMapResourceResult<TResource, TIncludes> | IMapResourceListResult<TResource, TIncludes> | IDataResourceResult<TResource, TIncludes> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resource = ctor instanceof Resource ? ctor : useService(ctor);
  const unmountedRef = useObjectRef({ unmounted: false });
  const errorContext = useContext(ErrorContext);
  const [loadingException, setLoadingException] = useState<Error | null>(null);
  const [loadFunctionName] = useState(`${component.name}.useResource(${resource.getName()}).load` as const);

  actions = useObjectRef(actions ?? ({} as any));

  const { key, includes, isChanged } = useResourceStableKey(resource, keyObj);

  if (isChanged) {
    setLoadingException(null);
  }

  useResourceTracker(resource, key);

  function getData(key: ResourceKey<TKeyArg> | null, resource: TResource): any {
    if (resource instanceof CachedDataResource) {
      return resource.data;
    }
    if (resource instanceof CachedMapResource) {
      if (key === null) {
        if (isResourceKeyList(key) || isResourceKeyListAlias(key)) {
          return [];
        }

        // TODO: this is incorrect return type (key == null)
        return undefined;
      }
      return resource.get(key);
    }

    return resource.data;
  }

  const preloaded = actions?.active !== false;
  const [loadMutex] = useState(() => new mutex.Mutex());

  const refObj = useObjectRef(
    () => ({
      async [loadFunctionName](key: ResourceKey<TKeyArg>, includes: TIncludes, resource: TResource, refresh?: boolean): Promise<void> {
        if (refresh) {
          await resource.refresh(key, includes as any);
        } else {
          await resource.load(key, includes as any);
        }
      },
      async load(key: ResourceKey<TKeyArg>, includes: TIncludes, resource: TResource, refresh?: boolean): Promise<void> {
        await loadMutex.runExclusive(async () => {
          try {
            if (unmountedRef.unmounted) {
              return;
            }
            await this[loadFunctionName]!(key, includes, resource, refresh);
            setLoadingException(null);
          } catch (exception: any) {
            console.error(exception);
            if (actions?.silent !== true && this.errorContext) {
              const resourceException: Error | Error[] | null = resource.getException(key);
              if (isContainsException(resourceException)) {
                const errors = Array.isArray(resourceException) ? resourceException : [resourceException];

                for (const error of errors) {
                  if (error) {
                    this.errorContext.catch(error);
                  }
                }
              } else {
                const loadingError = new LoadingError(
                  () => {
                    setLoadingException(null);
                    this.load.bind(this, key, includes, resource, true);
                  },
                  'Application is unable to load resource',
                  { cause: exception },
                );
                setLoadingException(loadingError);
                this.errorContext.catch(loadingError);
              }
            }
          }
        });
      },
    }),
    { errorContext },
  );

  const loading = getComputed(() => key !== null && resource.isLoading(key));
  const loaded = getComputed(() => key === null || resource.isLoaded(key, includes));
  const outdated = getComputed(() => key === null || resource.isOutdated(key, includes));
  const canLoad = key !== null && actions?.freeze !== true && preloaded && outdated && !loading;

  const result = useMemo<IMapResourceResult<TResource, TIncludes> | IMapResourceListResult<TResource, TIncludes>>(
    () => ({
      resource,
      get tryGetData() {
        return getData(key, resource);
      },
      get data() {
        // React Suspense block

        if (!this.isLoaded() && key !== null) {
          if (loading || canLoad) {
            throw Promise.resolve().then(() => refObj.load(key, includes, resource));
          }
        }

        if (this.isError()) {
          throw this.exception;
        }
        // TODO: should we call it anyway even if resource loaded?
        //       not forcing loading may lead to problems related to outdated resources
        // if (this.canLoad) {
        //   throw refObj.load();
        // }
        //---------------------

        return getData(key, resource);
      },
      get exception() {
        if (loadingException) {
          return loadingException;
        }

        if (key === null) {
          return null;
        }

        return resource.getException(key);
      },
      isError() {
        return isContainsException(this.exception);
      },
      isOutdated(): boolean {
        return outdated;
      },
      isLoaded(): boolean {
        return loaded;
      },
      reload: async (): Promise<void> => {
        if (key !== null) {
          return await refObj.load(key, includes, resource, true);
        }
      },
      load: async (): Promise<void> => {
        if (key !== null) {
          return await refObj.load(key, includes, resource);
        }
      },
      isLoading(): boolean {
        return loading;
      },
    }),
    [outdated, loaded, loading, loadingException, resource, canLoad, key, includes],
  );

  useEffect(() => {
    if (!result.isError()) {
      return;
    }
    if (actions?.silent !== true && errorContext) {
      const errors = Array.isArray(result.exception) ? result.exception : [result.exception];
      for (const error of errors) {
        if (error) {
          errorContext.catch(error);
        }
      }
    }
  }, [errorContext, actions?.silent, result.exception, result.isError()]);

  useEffect(() => {
    if (canLoad) {
      result.load();
    }
  }, [result]);

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
