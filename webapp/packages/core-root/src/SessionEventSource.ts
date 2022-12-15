/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { catchError, debounceTime, filter, map, merge, Observable, retry, RetryConfig, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { injectable } from '@cloudbeaver/core-di';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import {
  GraphQLService,
  EnvironmentService,
  CbEventTopic as SessionEventTopic,
  CbServerEventId as ServerEventId,
  CbClientEventId as ClientEventId,
  ServiceError,
} from '@cloudbeaver/core-sdk';

import type { IBaseServerEvent, IServerEventCallback, IServerEventEmitter, Subscription } from './ServerEventEmitter/IServerEventEmitter';

export { ServerEventId, SessionEventTopic, ClientEventId };

export type SessionEventId = ServerEventId | ClientEventId;

export interface ISessionEvent extends IBaseServerEvent<SessionEventId, SessionEventTopic> {
  id: SessionEventId;
  topic?: SessionEventTopic;
  [key: string]: any;
}

export interface ITopicSubEvent extends ISessionEvent {
  id: ClientEventId.CbClientTopicSubscribe | ClientEventId.CbClientTopicUnsubscribe;
  topic: SessionEventTopic;
}

const retryInterval = 5000;

const retryConfig: RetryConfig = {
  delay: retryInterval,
};

@injectable()
export class SessionEventSource
implements IServerEventEmitter<ISessionEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  readonly eventsSubject: Observable<ISessionEvent>;
  readonly onInit: ISyncExecutor;


  private readonly closeSubject: Subject<CloseEvent>;
  private readonly openSubject: Subject<Event>;
  private readonly errorSubject: Subject<Error>;
  private readonly subject: WebSocketSubject<ISessionEvent>;
  private readonly oldEventsSubject: Subject<ISessionEvent>;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly graphQLService: GraphQLService
  ) {
    this.onInit = new SyncExecutor();
    this.oldEventsSubject = new Subject();
    this.closeSubject = new Subject();
    this.openSubject = new Subject();
    this.errorSubject = new Subject();
    this.subject = webSocket({
      url: environmentService.wsEndpoint,
      closeObserver: this.closeSubject,
      openObserver: this.openSubject,
    });

    this.openSubject.subscribe(() => {
      this.onInit.execute();
    });

    this.eventsSubject = merge(this.oldEventsSubject, this.subject);

    this.errorSubject
      .pipe(debounceTime(1000))
      .subscribe(error => {
        console.error(error);
      });

    this.errorHandler = this.errorHandler.bind(this);
  }

  onEvent<T = ISessionEvent>(
    id: SessionEventId,
    callback: IServerEventCallback<T>,
    mapTo: (event: ISessionEvent) => T = e => e as T,
  ): Subscription {
    const sub = this.eventsSubject
      .pipe(
        catchError(this.errorHandler),
        filter(event => event.id === id),
        map(mapTo)
      )
      .subscribe(callback);

    return () => {
      sub.unsubscribe();
    };
  }

  on<T = ISessionEvent>(
    callback: IServerEventCallback<T>,
    mapTo: (event: ISessionEvent) => T = e => e as T,
    filterFn: (event: ISessionEvent) => boolean = () => true,
  ): Subscription {
    const sub = this.eventsSubject
      .pipe(
        catchError(this.errorHandler),
        filter(filterFn),
        map(mapTo)
      )
      .subscribe(callback);

    return () => {
      sub.unsubscribe();
    };
  }

  multiplex<T = ISessionEvent>(
    topic: SessionEventTopic,
    mapTo: ((event: ISessionEvent) => T)  = e => e as T
  ): Observable<T> {
    return merge(
      this.subject.multiplex(
        () => ({ id: ClientEventId.CbClientTopicSubscribe, topic } as ITopicSubEvent),
        () => ({ id: ClientEventId.CbClientTopicUnsubscribe, topic } as ITopicSubEvent),
        event => event.topic === topic
      ),
      this.oldEventsSubject,
    ).pipe(
      catchError(this.errorHandler),
      map(mapTo)
    );
  }

  emit(event: ISessionEvent): this {
    this.subject.next(event);
    return this;
  }

  private errorHandler(error: any, caught: Observable<ISessionEvent>): Observable<ISessionEvent> {
    this.errorSubject.next(new ServiceError('WebSocket connection error'));
    return caught;
  }
}
