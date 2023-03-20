/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Path } from 'path-parser';

import { createPath, Join } from './createPath';

export type PathTemplate<TParams extends Record<string, any>> = Path<TParams>;
export type PathArgs<TPath> = TPath extends `${infer TPart}/${infer TNextPath}`
  ? PathArgs<TNextPath> | TPart
  : TPath;

export type PathParamKey<T extends string> = T extends `${':' | '*'}${infer TArg}<${string}`
  ? TArg
  : T extends `${':' | '*'}${infer TArg}` ? TArg : never;
export const pathSymbol = Symbol('path');

interface IPathParams<TTemplate> {
  [pathSymbol]?: TTemplate;
}

export type PathParams<TTemplate extends string> = {
  [P in PathArgs<TTemplate> as PathParamKey<P>]: string;
} & IPathParams<TTemplate>;

export type JoinTemplates<TTemplates extends (string | PathTemplate<PathParams<string>>)[]> = (
  TTemplates extends [infer TFirst, ...infer TRest] ? (
    TFirst extends string ? (
      TRest extends []
        ? TFirst
        : (
          TRest extends (string | PathTemplate<PathParams<string>>)[]
            ? Join<[TFirst, JoinTemplates<TRest>], '/'>
            : TFirst
        )
    ) : (
      TFirst extends PathTemplate<PathParams<infer TTemplate>> ? (
        TRest extends []
          ? TTemplate
          : (
            TRest extends (string | PathTemplate<PathParams<string>>)[]
              ? Join<[TTemplate, JoinTemplates<TRest>], '/'>
              : TTemplate
          )
      ) : ''
    )
  ) : ''
);

export function createPathTemplate<
  TTemplates extends (string | PathTemplate<PathParams<string>>)[],
  TParams extends PathParams<JoinTemplates<TTemplates>>
>(
  ...templates: TTemplates
): PathTemplate<TParams> {
  return new Path(createPath(...templates
    .map(template => typeof template === 'string' ? template : template.path)
  ));
}
