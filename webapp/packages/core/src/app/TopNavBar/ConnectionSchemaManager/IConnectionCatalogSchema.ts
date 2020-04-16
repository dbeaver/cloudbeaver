/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */


export interface IConnectionCatalogSchema {
  connectionId: string;
  schemaId: string | null; // some dbs has no schema
  catalogId: string | null; // some dbs has no catalog
}

export interface ITabHasConnectionChangeBehavior extends IConnectionCatalogSchema {
  // todo remove optional sign whem we can destinguish ITabHasConnectionBehavior and ITabHasConnectionBehavior
  changeSchema?: (connectionCatalogSchema: IConnectionCatalogSchema) => Promise<IConnectionCatalogSchema>;
}
