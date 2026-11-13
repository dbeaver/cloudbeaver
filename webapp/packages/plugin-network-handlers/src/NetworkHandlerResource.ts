/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapAllKey, CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { GraphQLService, type NetworkHandlerConfigInput, type NetworkHandlerDescriptor } from '@cloudbeaver/core-sdk';

export const SSH_TUNNEL_ID = 'ssh_tunnel';

export class NetworkHandlerResourceImpl extends CachedMapResource<string, NetworkHandlerDescriptor> {
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

  async test(config: NetworkHandlerConfigInput, projectId?: string, connectionId?: string): Promise<void> {
    try {
      const { info } = await this.graphQLService.sdk.testNetworkHandler({ projectId, connectionId, config });
      this.notificationService.logSuccess({
        title: 'plugin_network_handlers_ssh_test_success',
        message: 'Client version: ' + info.clientVersion + '\nServer version: ' + info.serverVersion,
      });
    } catch (exception: any) {
      this.notificationService.logException(exception, 'plugin_network_handlers_ssh_test_fail');
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

export type NetworkHandlerResource = NetworkHandlerResourceImpl;

export class NetworkHandlerResourceDI extends Context.Service<NetworkHandlerResourceDI, NetworkHandlerResourceImpl>()(
  '@cloudbeaver/plugin-network-handlers/NetworkHandlerResource#NetworkHandlerResource',
) {
  static readonly implementation = NetworkHandlerResourceImpl;

  static readonly dependencies = () => [GraphQLService, NotificationService, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    NetworkHandlerResourceImpl,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makeNetworkHandlerResource() {
    const graphQLService = yield* GraphQLService;
    const notificationService = yield* NotificationService;
    const serverConfigResource = yield* ServerConfigResource;

    return new NetworkHandlerResourceImpl(graphQLService, notificationService, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    NetworkHandlerResourceDI,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const NetworkHandlerResource = NetworkHandlerResourceDI;
