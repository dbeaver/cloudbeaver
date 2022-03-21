/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState, useEffect } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { ErrorBoundary } from './ErrorBoundary';

interface IComplexLoaderData<T> {
  promise: Promise<T> | undefined;
  data: T | undefined;
  error: Error | undefined;
  loader: () => Promise<T>;
}

export interface ComplexLoaderProps<T> {
  loader: IComplexLoaderData<T>;
  placeholder: React.ReactElement;
  keepLoading?: boolean;
  children: (content: T) => JSX.Element;
}

export const ComplexLoader: React.FC<ComplexLoaderProps<any>> = function ComplexLoader(props) {
  const [content, setContent] = useState<unknown | null>(props.loader.data);
  const notificationService = useService(NotificationService);

  useEffect(() => {
    let unmounted = false;

    if (!content) {
      props
        .loader
        .loader()
        .then(value => !unmounted && setContent(value))
        .catch(exception => !unmounted && notificationService.logException(exception, 'Can\'t load resource'));
    }

    return () => {
      unmounted = true;
    };
  }, [content]);

  if (!content || props.keepLoading) {
    return props.placeholder;
  }

  function refresh() {
    setContent(null);
  }

  return (
    <ErrorBoundary onRefresh={refresh}>
      {props.children(content)}
    </ErrorBoundary>
  );
};

export function createComplexLoader<T>(loader: () => Promise<T>): IComplexLoaderData<T> {
  return {
    promise: undefined,
    data: undefined,
    error: undefined,
    async loader() {
      if (this.data !== undefined) {
        return this.data;
      }

      if (this.error) {
        throw this.error;
      }

      if (this.promise) {
        return await this.promise;
      }

      this.promise = loader();

      try {
        this.data = await this.promise;
        return this.data;
      } catch (exception: any) {
        this.error = exception;

        throw exception;
      }
    },
  };
}
