/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { graphql } from 'msw';

export function createGQLEndpoint(): ReturnType<typeof graphql.link> {
  return graphql.link('http://127.0.0.1:8978/api/gql');
}