/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable, toJS, untracked, when } from 'mobx';
import { useEffect, useContext, useState } from 'react';

import { IServiceConstructor, useService } from '@cloudbeaver/core-di';
import { CachedMapResource, CachedMapResourceGetter, CachedMapResourceValue, CachedMapResourceLoader, ResourceKeyList, CachedMapResourceListGetter, isResourceKeyList, CachedResourceData, CachedDataResourceGetter, CachedResource, CachedDataResource, CachedResourceParam, CachedResourceKey, CachedResourceContext, ResourceError } from '@cloudbeaver/core-sdk';
import { ILoadableState, isArraysEqual, isContainsException, LoadingError } from '@cloudbeaver/core-utils';

import { ErrorContext } from '../ErrorContext';
import { getComputed } from '../getComputed';
import { useObjectRef } from '../useObjectRef';
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
  onData?: (
    data: ResourceData<TResource, TKey, TIncludes>,
    resource: TResource,
    prevData: ResourceData<TResource, TKey, TIncludes> | undefined,
  ) => Promise<any> | any;
  onError?: (exception: Error | Error[] | null) => void;
  preload?: ILoadableState[];
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
  load: () => void;
  reload: () => void;
}

interface IMapResourceListResult<TResource, TIncludes> extends IMapResourceState<TResource> {
  data: CachedMapResourceListGetter<
  CachedMapResourceValue<TResource>,
  TIncludes
  >;
  tryGetData: CachedMapResourceListGetter<
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
  tryGetData: CachedMapResourceGetter<
  CachedMapResourceValue<TResource>,
  TIncludes
  >;
  exception: Error | null;
}

interface IDataResourceResult<TResource, TIncludes> extends IMapResourceState<TResource> {
  data: CachedDataResourceGetter<CachedResourceData<TResource>, TIncludes>;
  tryGetData: CachedDataResourceGetter<CachedResourceData<TResource>, TIncludes>;
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
  const errorContext = useContext(ErrorContext);
  let key: TKeyArg | null = keyObj as TKeyArg;
  let includes: TIncludes = [] as unknown as TIncludes;
  const [loadFunctionName] = useState(`${component.name}.useResource(${resource.getName()}).load`);

  if (isKeyWithIncludes<TKeyArg, TIncludes>(keyObj)) {
    key = keyObj.key;
    includes = keyObj.includes;
  }

  actions = useObjectRef(actions ?? {} as any);

  const propertiesRef = useObservableRef(() => ({
    key,
    includes,
    resource,
    errorContext,
  }), {
    key: observable.ref,
    includes: observable.ref,
    resource: observable.ref,
    errorContext: observable.ref,
  }, false);

  untracked(() => {
    if (!isArraysEqual(includes, propertiesRef.includes)) {
      propertiesRef.includes = includes;
    }

    if (
      key === null
      || propertiesRef.key === null
      || !propertiesRef.resource.includes(key, propertiesRef.key)
    ) {
      propertiesRef.key = key;
    }
  });

  function getData(): any {
    if (propertiesRef.resource instanceof CachedMapResource) {
      if (propertiesRef.key === null) {
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
    if (actions?.preload) {
      for (const preload of actions.preload) {
        if (
          !preload.isLoaded()
          || preload.isOutdated?.()
          || preload.isLoading()
          || preload.isError()
        ) {
          return false;
        }
      }
    }
    return true;
  });

  const refObj = useObservableRef(() => ({
    loadingPromise: null as (Promise<void> | null),
    exception: null as Error | null,
    useRef: [null, ''] as [TKeyArg | null, string],
    get resourceException() {
      if (propertiesRef.key === null) {
        return null;
      }

      return propertiesRef.resource.getException(propertiesRef.key);
    },
    isResourceError() {
      return isContainsException(this.resourceException);
    },
    use(key: TKeyArg | null) {
      key = toJS(key);

      if (this.useRef[0] !== null) {
        if (key !== null && propertiesRef.resource.includes(key, this.useRef[0])) {
          return;
        }

        propertiesRef.resource.free(this.useRef[0], this.useRef[1]);
      }
      this.useRef = [key, key === null ? '' : propertiesRef.resource.use(key)];
    },
    async [loadFunctionName](refresh?: boolean) {
      const { key, includes, resource } = propertiesRef;

      if (refresh) {
        resource.markOutdated(key);
      }

      await resource.load(key, includes as any);
    },
    async load(refresh?: boolean) {
      if (this.loadingPromise) {
        return this.loadingPromise;
      }

      if (propertiesRef.key === null) {
        return;
      }

      try {
        this.loadingPromise = this[loadFunctionName](refresh);
        await this.loadingPromise;
        this.exception = null;
      } catch (exception: any) {
        if (propertiesRef.errorContext) {
          if (this.isResourceError()) {
            const errors = Array.isArray(this.resourceException) ? this.resourceException : [this.resourceException];

            for (const error of errors) {
              if (error) {
                propertiesRef.errorContext.catch(error);
              }
            }
          } else {
            this.exception = new LoadingError(() => {
              this.exception = null;
              this.load.bind(this, true);
            }, 'Application is unable to load resource', { cause: exception });
            propertiesRef.errorContext.catch(this.exception);
          }
        }
      } finally {
        this.loadingPromise = null;
      }
    },
  }), {
    resourceException: computed,
    exception: observable.ref,
    loadingPromise: observable.ref,
  }, false);

  const result = useObservableRef<(
  IMapResourceResult<TResource, TIncludes>
  | IMapResourceListResult<TResource, TIncludes>
  ) & IResourcePrivateState
  >(() => ({
      preloaded,
      get canLoad() {
        return (
          propertiesRef.key !== null
          && this.preloaded
          && this.outdated
          && !this.loading
        );
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
        if (
          propertiesRef.key === null
          && this.resource instanceof CachedMapResource
        ) {
          return undefined;
        }

        return getData();
      },
      get data() {
        if (
          propertiesRef.key === null
          && this.resource instanceof CachedMapResource
        ) {
          return undefined;
        }

        // React Suspense block
        if (refObj.loadingPromise) {
          throw refObj.loadingPromise;
        }

        if (this.loading) {
          throw this.resource.waitLoad();
        }

        if (this.canLoad) {
          throw refObj.load();
        }

        if (this.isError()) {
          throw this.exception;
        }
        //---------------------

        return getData();
      },
      get outdated() {
        return (
          propertiesRef.key === null
          || !this.preloaded
          || this.loading
          || !this.loaded
          || this.resource.isOutdated(propertiesRef.key)
        );
      },
      get loaded() {
        if (propertiesRef.key === null) {
          return true;
        }

        if (this.isError()) {
          return false;
        }

        return this.resource.isLoaded(propertiesRef.key, propertiesRef.includes);
      },
      get loading(): boolean {
        if (propertiesRef.key === null) {
          return false;
        }

        return refObj.loadingPromise !== null || this.resource.isDataLoading(propertiesRef.key);
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
      reload: () => refObj.load(true),
      load: () => refObj.load(),
      isLoading() {
        return this.loading;
      },
    }), {
      canLoad: computed,
      exception: computed,
      tryGetData: computed,
      data: computed,
      outdated: computed,
      loaded: computed,
      loading: computed,
      preloaded: observable.ref,
    }, { preloaded });

  useEffect(() => {
    let prevData: any;
    const disposeDataUpdate = when(
      () => {
        try {
          if (result.isError()) {
            return false;
          }
          result.data;
          return true;
        } catch {
          return false;
        }
      },
      () => {
        const newData = result.data;
        refObj.actions?.onData?.(newData, resource, prevData);
        prevData = newData;
      }
    );
    const disposeErrorUpdate = when(
      () => result.isError(),
      () => {
        if (propertiesRef.errorContext) {
          const errors = Array.isArray(result.exception) ? result.exception : [result.exception];

          for (const error of errors) {
            if (error) {
              propertiesRef.errorContext.catch(error);
            }
          }
        }
        refObj.actions?.onError?.(result.exception);
      }
    );
    return () => {
      disposeDataUpdate();
      disposeErrorUpdate();
      refObj.use(null);
    };
  }, []);

  useEffect(() => {
    refObj.use(key);
    if (result.canLoad && !result.isError()) {
      result.load();
    }
  }, [result.canLoad]);

  return result;
}

function isKeyWithIncludes<TKey, TIncludes>(obj: any): obj is KeyWithIncludes<TKey, TIncludes> {
  return obj && typeof obj === 'object' && 'includes' in obj && 'key' in obj;
}
