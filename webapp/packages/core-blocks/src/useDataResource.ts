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

interface IMapResourceResult<TResource extends CachedDataResource<any, any, any>> {
  data: CachedResourceData<TResource>;
  resource: TResource;
  exception: Error | null;
  isLoading: () => boolean;
  isLoaded: () => boolean;
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

  const refObj = useObjectRef({
    resource,
    key,
    exception,
    includes,
    actions,
    prevData: (isResourceKeyList(key) ? [] : undefined) as CachedResourceData<TResource> | undefined,
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

  const [result] = useState<IMapResourceResult<TResource>>(() => ({
    get resource() {
      return refObj.resource;
    },
    get exception() {
      return refObj.exception;
    },
    get data() {
      return resource.data;
    },
    isLoaded: () => {
      if (refObj.key === null) {
        return false;
      }

      return resource.isLoaded(refObj.key, refObj.includes);
    },
    reload: () => {
      refObj.load();
    },
    isLoading: () => {
      if (refObj.key === null) {
        return false;
      }

      if (refObj.key === undefined) {
        return resource.isLoading();
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
