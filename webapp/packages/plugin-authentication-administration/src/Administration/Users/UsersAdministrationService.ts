/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { AdministrationItemService, type IAdministrationItem } from '@cloudbeaver/core-administration';
import { type AdminUser, TeamsResource, UsersResource } from '@cloudbeaver/core-authentication';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { TabsContainer } from '@cloudbeaver/core-ui';

import { EUsersAdministrationSub, UsersAdministrationNavigationServiceImpl } from './UsersAdministrationNavigationService.js';
import type { IUserFilters } from './UsersTable/Filters/useUsersTableFilters.js';

const UserCredentialsList = React.lazy(async () => {
  const { UserCredentialsList } = await import('./UsersTable/UserCredentialsList.js');
  return { default: UserCredentialsList };
});

const UsersDrawerItem = React.lazy(async () => {
  const { UsersDrawerItem } = await import('./UsersDrawerItem.js');
  return { default: UsersDrawerItem };
});

const UsersAdministration = React.lazy(async () => {
  const { UsersAdministration } = await import('./UsersAdministration.js');
  return { default: UsersAdministration };
});

export interface IUserDetailsInfoProps {
  user: AdminUser;
}

export interface IUsersActionButtonProps {
  filters: IUserFilters;
}

export class UsersAdministrationServiceImpl extends Bootstrap {
  readonly tabsContainer: TabsContainer;
  readonly userDetailsInfoPlaceholder: PlaceholderContainer<IUserDetailsInfoProps>;
  readonly informationPlaceholder: PlaceholderContainer;
  readonly actions = new PlaceholderContainer();
  readonly actionButtonsPlaceholder: PlaceholderContainer<IUsersActionButtonProps>;
  administrationItem!: IAdministrationItem;

  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly teamsResource: TeamsResource,
    private readonly usersResource: UsersResource,
  ) {
    super();
    this.userDetailsInfoPlaceholder = new PlaceholderContainer();
    this.tabsContainer = new TabsContainer('Access Control');
    this.informationPlaceholder = new PlaceholderContainer();
    this.actionButtonsPlaceholder = new PlaceholderContainer();
  }

  override register(): void {
    this.administrationItem = this.administrationItemService.create({
      name: UsersAdministrationNavigationServiceImpl.ItemName,
      order: 4,
      sub: [
        {
          name: EUsersAdministrationSub.MetaProperties,
        },
        {
          name: EUsersAdministrationSub.Users,
          onDeActivate: this.handleUsersDeactivate.bind(this),
        },
        {
          name: EUsersAdministrationSub.Teams,
          onDeActivate: this.handleTeamsDeactivate.bind(this),
        },
      ],
      defaultSub: EUsersAdministrationSub.Users,
      getContentComponent: () => UsersAdministration,
      getDrawerComponent: () => UsersDrawerItem,
    });

    this.userDetailsInfoPlaceholder.add(UserCredentialsList, 0);
  }

  private handleUsersDeactivate(param: string | null, configurationWizard: boolean, outside: boolean) {
    if (outside) {
      this.usersResource.cleanNewFlags();
    }
  }

  private handleTeamsDeactivate(param: string | null, configurationWizard: boolean, outside: boolean) {
    if (outside) {
      this.teamsResource.cleanNewFlags();
    }
  }
}

export type UsersAdministrationService = UsersAdministrationServiceImpl;

export class UsersAdministrationServiceDI extends Context.Service<UsersAdministrationServiceDI, UsersAdministrationServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/UsersAdministrationService#UsersAdministrationService',
) {
  static readonly implementation = UsersAdministrationServiceImpl;

  static readonly dependencies = () => [AdministrationItemService, TeamsResource, UsersResource] as const;
  static readonly make: Effect.Effect<
    UsersAdministrationServiceImpl,
    never,
    | Context.Service.Identifier<typeof AdministrationItemService>
    | Context.Service.Identifier<typeof TeamsResource>
    | Context.Service.Identifier<typeof UsersResource>
  > = Effect.gen(function* makeUsersAdministrationService() {
    const administrationItemService = yield* AdministrationItemService;
    const teamsResource = yield* TeamsResource;
    const usersResource = yield* UsersResource;

    return new UsersAdministrationServiceImpl(administrationItemService, teamsResource, usersResource);
  });
  static readonly layer: Layer.Layer<
    UsersAdministrationServiceDI,
    never,
    | Context.Service.Identifier<typeof AdministrationItemService>
    | Context.Service.Identifier<typeof TeamsResource>
    | Context.Service.Identifier<typeof UsersResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UsersAdministrationService = UsersAdministrationServiceDI;
