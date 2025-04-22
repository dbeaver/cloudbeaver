/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { toJS } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { GraphQLService, type SecretInfo } from '@cloudbeaver/core-sdk';
import { schemaValidationError } from '@cloudbeaver/core-utils';
import { isDefined } from '@dbeaver/js-helpers';

import { CONNECTION_INFO_PARAM_SCHEMA, type IConnectionInfoParams } from './CONNECTION_INFO_PARAM_SCHEMA.js';
import {
  ConnectionInfoActiveProjectKey,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
  isConnectionInfoParamEqual,
} from './ConnectionInfoResource.js';

export type PublicSecretInfo = SecretInfo;

@injectable()
export class ConnectionPublicSecretsResource extends CachedMapResource<IConnectionInfoParams, PublicSecretInfo[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private connectionInfoResource: ConnectionInfoResource,
  ) {
    super();
    this.sync(connectionInfoResource, key => {
      const connectionInfoProjectKey = this.aliases.isAlias(key, ConnectionInfoProjectKey);
      const connectionInfoActiveProjectKey = this.aliases.isAlias(key, ConnectionInfoActiveProjectKey);

      if (connectionInfoProjectKey) {
        return resourceKeyList(
          connectionInfoResource
            .get(connectionInfoProjectKey as any as ResourceKeyList<any>)
            ?.filter(isDefined)
            .map(createConnectionParam),
        );
      }

      if (connectionInfoActiveProjectKey) {
        return resourceKeyList(
          connectionInfoResource
            .get(connectionInfoActiveProjectKey as any as ResourceKeyList<any>)
            ?.filter(isDefined)
            .map(createConnectionParam),
        );
      }

      return key;
    });
    this.connectionInfoResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  protected async loader(originalKey: ResourceKey<IConnectionInfoParams>): Promise<Map<IConnectionInfoParams, PublicSecretInfo[]>> {
    if (isResourceAlias(originalKey)) {
      throw new Error('Aliases are not supported in this resource');
    }

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      const { connections } = await this.graphQLService.sdk.getPublicConnectionSecrets({
        projectId: key.projectId,
        connectionId: key.connectionId,
      });

      if (connections.length === 0) {
        throw new Error('Connection not found');
      }
      const connection = connections[0]!;

      this.set(key, connection.sharedSecrets);
    });

    return this.data;
  }

  override isKeyEqual(param: IConnectionInfoParams, second: IConnectionInfoParams): boolean {
    return isConnectionInfoParamEqual(param, second);
  }

  protected validateKey(key: IConnectionInfoParams): boolean {
    const parse = CONNECTION_INFO_PARAM_SCHEMA.safeParse(toJS(key));
    if (!parse.success) {
      this.logger.warn(`Invalid resource key ${schemaValidationError(parse.error, { prefix: null }).toString()}`);
    }
    return parse.success;
  }
}
