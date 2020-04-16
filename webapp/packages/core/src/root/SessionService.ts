/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

import { injectable } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';
import { LocalizationService } from '@dbeaver/core/localization';
import {
  ConnectionInfo, GQLError, GraphQLService, ServerLanguage, SessionInfo,
} from '@dbeaver/core/sdk';

import { EServerErrorCode } from '../sdk/EServerErrorCode';
import { SessionExpiredDialog } from './SessionExpiredDialog';

export type ConnectionShortInfo = Pick<ConnectionInfo, 'id' | 'name' | 'driverId'>;
export type SessionShortInfo = Pick<SessionInfo, 'locale' | 'connections'>;

export type Session = {
  name: string;
  version: string;
  language: string;
  supportedLanguages: Pick<ServerLanguage, 'isoCode' | 'nativeName'>[];
  connections: ConnectionShortInfo[];
}

export type Server = {
  name: string;
  version: string;
  supportedLanguages: ConnectionShortInfo[];
}

@injectable()
export class SessionService {
  private session: Session = {
    name: '',
    version: '',
    language: 'en',
    supportedLanguages: [],
    connections: [],
  };

  @computed get version() {
    return this.session.version;
  }

  private isNotifiedAboutExpiredSession = false;

  constructor(private graphQLService: GraphQLService,
              private localizationService: LocalizationService,
              private commonDialogService: CommonDialogService) {
    this.graphQLService.registerInterceptor(this.sessionExpiredInterceptor.bind(this));
  }

  getConnections(): ConnectionShortInfo[] {
    return this.session.connections;
  }

  async init(): Promise<void> {
    this.session = await this.fetchCurrentSession();

    this.localizationService.init(this.session.language, this.session.supportedLanguages);

  }

  private async sessionExpiredInterceptor(request: Promise<any>): Promise<any> {
    try {
      return await request;
    } catch (exception) {
      if (exception instanceof GQLError
        && exception.errorCode === EServerErrorCode.sessionExpired
        && !this.isNotifiedAboutExpiredSession) {
        this.isNotifiedAboutExpiredSession = true;
        await this.commonDialogService.open(SessionExpiredDialog, null);
      }
      throw exception;
    }
  }

  private async fetchCurrentSession(): Promise<Session> {
    const { serverConfig } = await this.graphQLService.gql.serverConfig();
    const sessionInfo = await this.openNewSession();

    const session: Session = {
      name: serverConfig.name || 'WHERE IS A NAME',
      version: serverConfig.version || 'WHERE IS A VERSION',
      language: sessionInfo.locale || 'en',
      supportedLanguages: serverConfig.supportedLanguages,
      connections: sessionInfo.connections || [],
    };
    return session;
  }

  private async openNewSession(): Promise<SessionShortInfo> {
    const response = await this.graphQLService.gql.openSession();
    return response.session;
  }
}
