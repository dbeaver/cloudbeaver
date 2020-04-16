/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action } from 'mobx';

export type TabHandlerState<T = null> = {
  handlerId: string;
  state: T;
}

export type TabOptions = {
  nodeId: string;
  handlerId: string;
  handlerState: Map<string, TabHandlerState<any>>;
  name?: string;
  icon?: string;
}

export class Tab {
  @observable nodeId: string
  @observable handlerId: string
  @observable handlerState: Map<string, TabHandlerState<any>>
  @observable name?: string
  @observable icon?: string

  constructor(options: TabOptions) {
    this.nodeId = options.nodeId;
    this.handlerId = options.handlerId;
    this.name = options.name;
    this.icon = options.icon;
    this.handlerState = options.handlerState;
  }

  @action selectHandler(handlerId: string) {
    this.handlerId = handlerId;
  }

  @action updateHandlerState<T>(state: TabHandlerState<T>) {
    if (this.hasHandler(state.handlerId)) {
      const handlerState = this.handlerState.get(this.handlerId)!;
      handlerState.state = state.state;
    } else {
      this.handlerState.set(state.handlerId, state);
    }
  }

  hasHandler(handlerId: string) {
    return this.handlerState.has(handlerId);
  }

  getHandlerState<T>(handlerId: string): T | undefined {
    return this.handlerState.get(handlerId)?.state;
  }
}
