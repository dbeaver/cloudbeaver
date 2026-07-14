/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, resourceKeyList, type ResourceKey } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { GraphQLService, type ConnectionType as ConnectionTypeFragment } from '@cloudbeaver/core-sdk';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import { ConnectionInfoResource, createConnectionParam } from '../ConnectionInfoResource.js';

export type ConnectionType = ConnectionTypeFragment;

export const NEW_CONNECTION_TYPE_SYMBOL = Symbol('new-connection-type');
export type NewConnectionType = ConnectionType & { [NEW_CONNECTION_TYPE_SYMBOL]: boolean; timestamp: number };

@injectable(() => [GraphQLService, ConnectionInfoResource, ServerConfigResource])
export class ConnectionTypeResource extends CachedMapResource<string, ConnectionType> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    serverConfigResource: ServerConfigResource,
  ) {
    super();

    this.onItemDelete.addHandler(this.handleTypeChanges.bind(this));
    this.onItemUpdate.addHandler(this.handleTypeChanges.bind(this));
    this.onDataOutdated.addHandler(this.handleTypeChanges.bind(this));

    this.sync(
      serverConfigResource,
      () => {},
      () => CachedMapAllKey,
    );
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, ConnectionType>> {
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);

    const { types } = await this.graphQLService.sdk.getConnectionTypes();

    const key = resourceKeyList(types.map(type => type.id));
    if (all) {
      this.replace(key, types);
    } else {
      this.set(key, types);
    }

    return this.data;
  }

  compare(connectionTypeA: ConnectionType, connectionTypeB: ConnectionType): number {
    if (connectionTypeA.predefined !== connectionTypeB.predefined) {
      return connectionTypeA.predefined ? -1 : 1;
    }

    return connectionTypeA.name.localeCompare(connectionTypeB.name);
  }

  cleanNewFlags(): void {
    for (const connection of this.data.values()) {
      (connection as NewConnectionType)[NEW_CONNECTION_TYPE_SYMBOL] = false;
    }
  }

  async refreshAll(): Promise<Map<string, ConnectionType>> {
    await this.refresh(CachedMapAllKey);
    return this.data;
  }

  protected override validateKey(key: string): boolean {
    return typeof key === 'string';
  }

  private handleTypeChanges(key: ResourceKey<string>) {
    const types = this.get(key);

    if (!types) {
      return;
    }

    const typeIds: string[] = [];

    if (Array.isArray(types)) {
      typeIds.push(...types.filter(isNotNullDefined).map(type => type.id));
    } else {
      typeIds.push(types.id);
    }

    const connections = this.connectionInfoResource.values.filter(connection => typeIds.includes(connection.connectionType));

    if (!connections.length) {
      return;
    }

    const result = resourceKeyList(connections.map(connection => createConnectionParam(connection.projectId, connection.id)));
    this.connectionInfoResource.markOutdated(result);
  }
}

function isNewConnectionType(connection: ConnectionType | NewConnectionType): connection is NewConnectionType {
  return (connection as NewConnectionType)[NEW_CONNECTION_TYPE_SYMBOL];
}

export function compareNewConnectionTypes(a: ConnectionType, b: ConnectionType): number {
  if (isNewConnectionType(a) && isNewConnectionType(b)) {
    return b.timestamp - a.timestamp;
  }

  if (isNewConnectionType(b)) {
    return 1;
  }

  if (isNewConnectionType(a)) {
    return -1;
  }

  return 0;
}

export function mapColorValue(value: string): string {
  return `rgb(${value})`;
}

export const PREDEFINED_UNSET_COLOR = '255,255,255';
export const MAPPED_PREDEFINED_UNSET_COLOR = `rgba(${PREDEFINED_UNSET_COLOR}, 0)`;
export const DEFAULT_TYPE_ID = 'dev';
