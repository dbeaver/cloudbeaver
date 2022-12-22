/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Socket } from 'socket.io-client';

export enum ESocketReservedEvents {
  Connect = 'connect',
  Disconnect = 'disconnect',
  ConnectError = 'connect_error'
}

export interface ISocketReservedEvent {
  name: ESocketReservedEvents;
  reason?: Socket.DisconnectReason;
}

export type ISocketEventData<T> = {
  name: string;
  data: T;
} | ISocketReservedEvent;

type IEventResolver<T> = (value: ISocketEventData<T> | null, done: boolean) => void;

export function getSocketIterable<T>(socket: Socket) {
  return new SocketIterable<T>(socket);
}

export class SocketIterable<T> implements AsyncIterable<ISocketEventData<T> | null> {
  private readonly queue: IEventResolver<T>[];

  private subscribed: boolean;
  constructor(private readonly socket: Socket) {
    this.queue = [];
    this.subscribed = false;

    this.subscription = this.subscription.bind(this);
  }

  [Symbol.asyncIterator](): AsyncIterator<ISocketEventData<T> | null> {
    this.subscribe();
    return {
      next: () => new Promise(resolve => {
        this.queue.push((value, done) => {
          resolve({ value, done });
        });
      }),
      return: () => {
        this.dispose();
        return Promise.resolve({ value: null, done: true });
      },
      throw: () => {
        this.dispose();
        return Promise.resolve({ value: null, done: true });
      },
    };
  }

  private dispose() {
    this.socket.offAny(this.subscription);
    this.subscribed = false;
  }

  private subscribe() {
    if (this.subscribed) {
      return;
    }
    this.socket.onAny(this.subscription);
    this.subscribed = true;
  }

  private subscription(name: string | ESocketReservedEvents, data?: T | Socket.DisconnectReason) {
    while (this.queue.length > 0) {
      const resolver = this.queue.shift();

      if (resolver) {
        if (isEventNameReserved(name)) {
          resolver({ name, reason: data as Socket.DisconnectReason }, this.socket.active);
        } else {
          resolver({ name, data: data as T }, this.socket.active);
        }
      }
    }
  }
}

function isEventNameReserved(name: string | ESocketReservedEvents): name is ESocketReservedEvents {
  return ['connect', 'disconnect', 'connect_error'].includes(name);
}

export function isEventReserved(event: ISocketEventData<any>): event is ISocketReservedEvent {
  return isEventNameReserved(event.name);
}