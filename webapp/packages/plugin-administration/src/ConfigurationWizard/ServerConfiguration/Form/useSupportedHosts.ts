/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import type { ServerConfigurationFormState } from '../ServerConfigurationFormState.js';
import { action, observable } from 'mobx';
import { getServerConfigurationFormPart } from '../getServerConfigurationFormPart.js';

const SUPPORTED_HOSTS_SEPARATOR = '\n';

function joinSupportedHosts(supportedHosts: string[]): string {
  return supportedHosts.join(SUPPORTED_HOSTS_SEPARATOR);
}

function splitSupportedHosts(supportedHosts: string): string[] {
  return supportedHosts
    .split(SUPPORTED_HOSTS_SEPARATOR)
    .map(host => host.trim())
    .filter(host => host.length > 0);
}

interface SupportedHostsState {
  supportedHosts: string;
  onChange: () => void;
}

export function useSupportedHosts(formState: ServerConfigurationFormState): SupportedHostsState {
  const part = getServerConfigurationFormPart(formState);
  const state = useObservableRef(
    () => ({
      supportedHosts: joinSupportedHosts(part.state.serverConfig.supportedHosts),
      onChange: function () {
        this.serverConfig.supportedHosts = splitSupportedHosts(this.supportedHosts);
      },
    }),
    {
      onChange: action.bound,
      supportedHosts: observable.ref,
    },
    {
      serverConfig: part.state.serverConfig,
    },
  );

  useExecutor({
    executor: formState.loadedTask,
    handlers: [
      function () {
        state.supportedHosts = joinSupportedHosts(part.state.serverConfig.supportedHosts);
      },
    ],
  });

  return state;
}
