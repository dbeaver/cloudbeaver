/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapAllKey, CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { GraphQLService, type NetworkHandlerConfigInput, type NetworkHandlerDescriptor } from '@cloudbeaver/core-sdk';

export const SSH_TUNNEL_ID = 'ssh_tunnel';

@injectable()
export class NetworkHandlerResource extends CachedMapResource<string, NetworkHandlerDescriptor> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly notificationService: NotificationService,
    serverConfigResource: ServerConfigResource,
  ) {
    super();
    this.sync(
      serverConfigResource,
      () => {},
      () => CachedMapAllKey,
    );
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

  protected async loader(): Promise<Map<string, NetworkHandlerDescriptor>> {
    const { handlers } = await this.graphQLService.sdk.getNetworkHandlers();

    this.replace(resourceKeyList(handlers.map(handler => handler.id)), handlers);
    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
