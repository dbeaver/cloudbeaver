/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, type IReactionDisposer, observable, reaction } from 'mobx';

import { useObservableRef } from './useObservableRef.js';

interface IObservedValueMetadata<TArgs, TValue> {
  reaction: IReactionDisposer | null;
  promise: Promise<TValue> | null;
  error: Error | null;
  value: TValue | symbol;
  version: number;
  run(args: TArgs): void;
}

interface ISuspense {
  observedValue<TArgs, TValue>(key: string, args: () => TArgs, loader: (args: TArgs) => Promise<TValue>): () => TValue;
}

interface ISuspenseState extends ISuspense {
  observedValueMetadata: Map<string, IObservedValueMetadata<any, any>>;
}

const VALUE_NOT_SET = Symbol('value not set');

/**
 * Experimental, use to pass suspended value getter to the child components
 *
 * (!!!) Don't access the suspended value in the same component where useSuspense is declared
 * @returns
 */
export function useSuspense(): ISuspense {
  const state = useObservableRef<ISuspenseState>(
    () => ({
      observedValueMetadata: new Map(),

      observedValue<TArgs, TValue>(key: string, args: () => TArgs, loader: (args: TArgs) => Promise<TValue>): () => TValue {
        let metadata = this.observedValueMetadata.get(key) as IObservedValueMetadata<TArgs, TValue> | undefined;

        if (!metadata) {
          metadata = observable<IObservedValueMetadata<TArgs, TValue>>(
            {
              reaction: null,
              promise: null,
              error: null,
              version: 0,
              value: VALUE_NOT_SET,
              run(args: TArgs): void {
                try {
                  this.promise = loader(args);
                  const version = ++this.version;

                  this.promise
                    .then(value => {
                      if (this.version === version) {
                        this.value = value;
                        this.error = null;
                      }
                    })
                    .catch(exception => {
                      if (this.version === version) {
                        this.error = exception;
                      }
                    })
                    .finally(() => {
                      if (this.version === version) {
                        this.promise = null;
                      }
                    });
                } catch (exception: any) {
                  this.error = exception;
                }
              },
            },
            {
              promise: observable.ref,
              error: observable.ref,
              value: observable.ref,
              run: action.bound,
            },
          );

          metadata!.run(args());

          metadata!.reaction = reaction(args, metadata!.run);

          this.observedValueMetadata.set(key, metadata!);
        }

        return () => {
          if (metadata!.promise) {
            throw metadata!.promise;
          }

          if (metadata!.error) {
            throw metadata!.error;
          }

          if (metadata!.value === VALUE_NOT_SET) {
            metadata!.run(args());
            throw metadata!.promise;
          }

          return metadata!.value as TValue;
        };
      },
    }),
    {
      observedValue: action.bound,
    },
    false,
  );

  return state;
}
