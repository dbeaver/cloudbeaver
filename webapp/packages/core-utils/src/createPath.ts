/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type Join<Items extends (string | undefined)[], Delimiter extends string = ''> = `${(
  Items extends [infer TFirst, ...infer TRest] ? (
    TFirst extends string ? (
      TRest extends [] | [undefined]
        ? TFirst
        : (
          TRest extends (string | undefined)[]
            ? `${TFirst}${Delimiter}${Join<TRest, Delimiter>}`
            : TFirst
        )
    ) : (
      TRest extends [] | [undefined]
        ? ''
        : (
          TRest extends (string | undefined)[]
            ? Join<TRest, Delimiter>
            : ''
        )
    )
  ) : ''
)}`;

export function createPath<TParts extends Array<string | undefined>>(...names: TParts): Join<TParts, '/'> {
  return names.filter(Boolean).join('/') as Join<TParts, '/'>;
}
