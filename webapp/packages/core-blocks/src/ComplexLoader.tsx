/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { LoadingError } from '@cloudbeaver/core-utils';

export interface IComplexLoaderData<T> {
  promise: Promise<T> | undefined;
  data: T | undefined;
  error: Error | undefined;
  loader: () => Promise<T>;
  refresh: () => void;
}

export interface ComplexLoaderProps<T> {
  loader: IComplexLoaderData<T>;
  children: (content: T) => React.JSX.Element;
}

export function useComplexLoader<T>(loader: IComplexLoaderData<T>): T {
  if (loader.error) {
    throw loader.error;
  }
  if (loader.data) {
    return loader.data;
  }
  throw loader.loader();
}

export const ComplexLoader: React.FC<ComplexLoaderProps<any>> = function ComplexLoader(props) {
  if (props.loader.error) {
    throw props.loader.error;
  }
  if (props.loader.data) {
    return props.children(props.loader.data);
  }
  throw props.loader.loader();
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
      } catch (cause: any) {
        this.error = new LoadingError(() => this.refresh(), "Can't load element", { cause });
        throw this.error;
      }
    },
    refresh() {
      this.promise = undefined;
      this.data = undefined;
      this.error = undefined;
    },
  };
}
