/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ServerConfigQuery } from '@cloudbeaver/core-sdk';

import { defaultProductConfiguration } from './defaultProductConfiguration.js';

export const defaultServerConfig: (productConfiguration?: Record<string, any>) => ServerConfigQuery = (
  productConfiguration = defaultProductConfiguration,
) => ({
  serverConfig: {
    name: 'CloudBeaver Community',
    version: '22.1.2.202207140640',
    workspaceId: 'D14DGNGYNPI71M',
    rootURI: '/',
    containerId: '931cdabfc0b3',
    productConfiguration: productConfiguration,
    supportsCustomConnections: true,
    forceHttps: true,
    supportedHosts: ['https://test.ce.cloudbeaver.io'],
    sessionExpireTime: 6000000,
    anonymousAccessEnabled: true,
    bindSessionToIp: 'disable',
    adminCredentialsSaveEnabled: true,
    publicCredentialsSaveEnabled: true,
    dbUserPasswordChangeEnabled: false,
    secretManagerEnabled: true,
    resourceManagerEnabled: true,
    distributed: false,
    configurationMode: false,
    developmentMode: false,
    redirectOnFederatedAuth: false,
    enabledFeatures: [],
    enabledAuthProviders: ['local'],
    supportedLanguages: [
      {
        isoCode: 'en',
        displayName: 'English',
        nativeName: 'English',
      },
      {
        isoCode: 'zh',
        displayName: 'Simplified chinese',
        nativeName: '简体中文',
      },
      {
        isoCode: 'ru',
        displayName: 'Russian',
        nativeName: 'Русский',
      },
      {
        isoCode: 'fr',
        displayName: 'French',
        nativeName: 'Français',
      },
      {
        isoCode: 'de',
        displayName: 'German',
        nativeName: 'Deutsch',
      },
      {
        isoCode: 'it',
        displayName: 'Italian',
        nativeName: 'Italiano',
      },
      {
        isoCode: 'ja',
        displayName: 'Japanese',
        nativeName: 'Japanese',
      },
      {
        isoCode: 'es',
        displayName: 'Spanish',
        nativeName: 'Spanish',
      },
      {
        isoCode: 'pt_BR',
        displayName: 'Portuguese (BR)',
        nativeName: 'Português Brasil',
      },
      {
        isoCode: 'ko',
        displayName: 'Korean',
        nativeName: '한국어',
      },
      {
        isoCode: 'tw',
        displayName: 'Traditional chinese',
        nativeName: '繁体中文',
      },
    ],
    disabledDrivers: [],
  },
});
