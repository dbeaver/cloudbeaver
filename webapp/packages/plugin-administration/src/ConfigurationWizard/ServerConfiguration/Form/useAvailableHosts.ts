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

const AVAILABLE_HOSTS_SEPARATOR = ',';

function joinAvailableHosts(availableHosts: string[]): string {
  return availableHosts.join(AVAILABLE_HOSTS_SEPARATOR + '\n');
}

function splitAvailableHosts(availableHosts: string): string[] {
  return availableHosts
    .split(AVAILABLE_HOSTS_SEPARATOR)
    .map(host => host.trim())
    .filter(host => host.length > 0);
}

interface AvailableHostsState {
  availableHosts: string;
  onAvailableHostsChange: () => void;
}

export function useAvailableHosts(formState: ServerConfigurationFormState): AvailableHostsState {
  const part = getServerConfigurationFormPart(formState);
  const state = useObservableRef(
    () => ({
      availableHosts: joinAvailableHosts(part.state.serverConfig.availableHosts),
      onAvailableHostsChange: function () {
        this.serverConfig.availableHosts = splitAvailableHosts(this.availableHosts);
      },
    }),
    {
      onAvailableHostsChange: action.bound,
      availableHosts: observable.ref,
    },
    {
      serverConfig: part.state.serverConfig,
    },
  );

  useExecutor({
    executor: formState.loadedTask,
    handlers: [
      function () {
        state.availableHosts = joinAvailableHosts(part.state.serverConfig.availableHosts);
      },
    ],
  });

  return state;
}
