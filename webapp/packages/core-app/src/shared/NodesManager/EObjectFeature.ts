/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export enum EObjectFeature {
  'script' = 'script', // for DDL viewer
  'scriptExtended' = 'scriptExtended',
  'dataContainer' = 'dataContainer',
  'dataManipulator' = 'dataManipulator',
  // in navigation tree we hide children for entities
  'entity' = 'entity',
  'schema' = 'schema',
  'catalog' = 'catalog',
  'dataSource' = 'dataSource', // connection
  'dataSourceTemporary' = 'dataSourceTemporary',
  'dataSourceConnected' = 'dataSourceConnected',
  'entityContainer' = 'entityContainer',
  'supportsDataFilter' = 'supportsDataFilter'
}
