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
import { CachedDataResource, CachedResourceData, CachedResourceParam, isResourceKeyList, ResourceKey } from '@cloudbeaver/core-sdk';

import { getComputed } from './getComputed';
import type { ILoadableState } from './Loader/Loader';
import { useObjectRef } from './useObjectRef';

interface IActions<TResource extends CachedDataResource<any, any, any>> {
  onLoad?: (resource: TResource) => Promise<any> | any;
  onData?: (
    data: CachedResourceData<TResource>,
    resource: TResource,
    prevData: CachedResourceData<TResource> | undefined,
  ) => Promise<any> | any;
  onError?: (exception: Error) => void;
}

interface IMapResourceResult<TResource extends CachedDataResource<any, any, any>> extends ILoadableState {
  data: CachedResourceData<TResource>;
  resource: TResource;
  exception: Error | null;
  reload: () => void;
}

export function useDataResource<
  TResource extends CachedDataResource<any, any, any>,
  TKeyArg extends ResourceKey<CachedResourceParam<TResource>>
>(
  ctor: IServiceConstructor<TResource> | TResource,
  keyObj: TResource extends any ? TKeyArg | null : never,
  actions?: IActions<TResource>
): IMapResourceResult<TResource> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resource = ctor instanceof CachedDataResource ? ctor : useService(ctor);
  const notifications = useService(NotificationService);
  const [exception, setException] = useState<Error | null>(null);
  const key = keyObj && typeof keyObj === 'object' && 'includes' in keyObj ? keyObj.key : keyObj;
  const includes = keyObj && typeof keyObj === 'object' && 'includes' in keyObj ? keyObj.includes : [];

  const outdated = getComputed(() => (
    (resource.isOutdated(key) || !resource.isLoaded(key, includes))
    && !resource.isDataLoading(key)
  ));

  const refObj = useObjectRef(() => ({
    loading: false,
    firstRender: true,
    prevData: (isResourceKeyList(key) ? [] : undefined) as CachedResourceData<TResource> | undefined,
    load: () => {},
  }), {
    exceptionObserved: false,
    resource,
    key,
    exception,
    includes,
    actions,
  });

  refObj.load = async function load() {
    this.firstRender = false;
    const { loading, resource, actions, prevData } = refObj;

    if (loading) {
      return;
    }

    this.loading = true;

    try {
      await actions?.onLoad?.(resource);

      if (key === null) {
        return;
      }

      const newData = await resource.load(key, includes);
      setException(null);

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
      if (resource.getException(key) === null) {
        setException(exception);
      }
      actions?.onError?.(exception);

      if (!refObj.exceptionObserved) {
        notifications.logException(exception, 'Can\'t load data');
      }
    } finally {
      this.loading = false;
    }
  };

  const [result] = useState<IMapResourceResult<TResource>>(() => ({
    get resource() {
      return refObj.resource;
    },
    get exception() {
      refObj.exceptionObserved = true;
      return refObj.exception || resource.getException(key);
    },
    get data() {
      return refObj.resource.data;
    },
    isLoaded: () => {
      if (refObj.key === null) {
        return false;
      }

      return refObj.resource.isLoaded(refObj.key, refObj.includes);
    },
    reload: () => {
      refObj.load();
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
    if (!outdated && !refObj.firstRender) {
      return;
    }

    if (result.exception === null) {
      refObj.load();
    }
  });

  return result;
}
