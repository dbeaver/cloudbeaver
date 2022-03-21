/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import {
  NetworkHandlerDescriptor,
  GraphQLService,
  CachedMapResource,
  resourceKeyList,
  NetworkHandlerConfigInput
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

export const SSH_TUNNEL_ID = 'ssh_tunnel';

@injectable()
export class NetworkHandlerResource extends CachedMapResource<string, NetworkHandlerDescriptor> {
  private loadedKeyMetadata: MetadataMap<string, boolean>;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly notificationService: NotificationService
  ) {
    super();
    this.loadedKeyMetadata = new MetadataMap(() => false);
  }

  has(id: string): boolean {
    if (this.loadedKeyMetadata.has(id)) {
      return this.loadedKeyMetadata.get(id);
    }

    return this.data.has(id);
  }

  async test(config: NetworkHandlerConfigInput): Promise<void> {
    try {
      const { info } = await this.graphQLService.sdk.testNetworkHandler({ config });
      this.notificationService.logSuccess({
        title: 'connections_network_handler_test_success',
        message: 'Client version: ' + info.clientVersion + '\nServer version: ' + info.serverVersion,
      });
    } catch (exception: any) {
      this.notificationService.logException(exception, 'connections_network_handler_test_fail');
    }
  }

  async loadAll(): Promise<Map<string, NetworkHandlerDescriptor>> {
    await this.load('all');
    return this.data;
  }

  protected async loader(key: string): Promise<Map<string, NetworkHandlerDescriptor>> {
    const { handlers } = await this.graphQLService.sdk.getNetworkHandlers();

    this.set(resourceKeyList(handlers.map(handler => handler.id)), handlers as NetworkHandlerDescriptor[]);

    // TODO: networkHandlers must accept descriptorId, so we can update some descriptor or all descriptors,
    //       here we should check is it's was a full update
    this.loadedKeyMetadata.set('all', true);

    return this.data;
  }
}
