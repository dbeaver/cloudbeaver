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
  CbServerEventType as ServerEventType,
  CbClientEventType as ClientEventType,
  ServiceError,
} from '@cloudbeaver/core-sdk';

import type { IServerEventCallback, IServerEventEmitter, Subscription } from './ServerEventEmitter/IServerEventEmitter';

export { ServerEventType, SessionEventTopic, ClientEventType };

export interface ISessionEvent {
  type: ServerEventType | ClientEventType;
  topic?: SessionEventTopic;
  [key: string]: any;
}

export interface ITopicSubEvent extends ISessionEvent {
  type: ClientEventType.CbClientTopicSubscribe | ClientEventType.CbClientTopicUnsubscribe;
  topic: SessionEventTopic;
}

const retryInterval = 5000;

const retryConfig: RetryConfig = {
  delay: retryInterval,
};

@injectable()
export class SessionEventSource implements IServerEventEmitter<ISessionEvent> {
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
    topic: string,
    mapTo: ((event: ISessionEvent) => T)  = e => e as T
  ): Observable<T> {
    return merge(
      this.subject.multiplex(
        () => ({ type: ClientEventType.CbClientTopicSubscribe, topic } as ITopicSubEvent),
        () => ({ type: ClientEventType.CbClientTopicUnsubscribe, topic } as ITopicSubEvent),
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
