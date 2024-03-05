/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type CachedResourceIncludeTemplate<TValue> = `include${Capitalize<string & keyof TValue>}` | `customInclude${Capitalize<string>}`;

type ExtractElementType<T> = T extends readonly unknown[] ? ArrayElement<T> : T;

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type CachedResourceIncludeFlags<TValue, TArgs> = {
  [P in keyof TArgs as P extends CachedResourceIncludeTemplate<TValue> ? P : never]?: boolean;
};

export type CachedResourceIncludeList<TValue> = Array<CachedResourceIncludeTemplate<TValue>>;
export type CachedResourceIncludeToKey<TKey> = TKey extends ReadonlyArray<`include${infer T}` | `customInclude${Capitalize<string>}`>
  ? Uncapitalize<T>
  : unknown;
export type CachedResourceIncludeArgs<TValue, TArguments> =
  | (TArguments extends Record<string, never>
      ? string[]
      : Array<Exclude<keyof CachedResourceIncludeFlags<Exclude<ExtractElementType<TValue>, undefined | null>, TArguments>, number | symbol>>)
  | [];

export type ApplyIncludes<TValue, TKeys> = TValue extends null | undefined
  ? TValue
  : TValue & {
      [P in Extract<CachedResourceIncludeToKey<TKeys>, keyof TValue>]-?: Required<TValue>[P] extends undefined ? TValue[P] : NonNullable<TValue[P]>;
    };

export type CachedResourceValueElementIncludes<TValue, TKeys> = TValue extends any
  ? TValue extends Array<infer TElement>
    ? TElement extends Record<any, any>
      ? Array<ApplyIncludes<TElement, TKeys>>
      : ApplyIncludes<TValue, TKeys>
    : ApplyIncludes<TValue, TKeys>
  : undefined;

export type CachedResourceValueIncludes<TValue, TKeys> = TValue extends any
  ? TKeys extends []
    ? TValue
    : TValue extends Array<infer TElement>
    ? TElement extends Record<any, any>
      ? Array<ApplyIncludes<TElement, TKeys>>
      : ApplyIncludes<TValue, TKeys>
    : ApplyIncludes<TValue, TKeys>
  : undefined;
