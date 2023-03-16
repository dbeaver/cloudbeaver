/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { catchError, debounceTime, filter, interval, map, merge, Observable, repeat, retry, share, Subject, throwError } from 'rxjs';
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

import { NetworkStateService } from './NetworkStateService';
import type { IBaseServerEvent, IServerEventCallback, IServerEventEmitter, Subscription } from './ServerEventEmitter/IServerEventEmitter';
import { SessionExpireService } from './SessionExpireService';

export { ServerEventId, SessionEventTopic, ClientEventId };

export type SessionEventId = ServerEventId | ClientEventId;

export interface ISessionEvent extends IBaseServerEvent<SessionEventId, SessionEventTopic> {
  id: SessionEventId;
  topicId?: SessionEventTopic;
  [key: string]: any;
}

export interface ITopicSubEvent extends ISessionEvent {
  id: ClientEventId.CbClientTopicSubscribe | ClientEventId.CbClientTopicUnsubscribe;
  topicId: SessionEventTopic;
}

const RETRY_INTERVAL = 30 * 1000;

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
  private readonly retryTimer: Observable<number>;

  constructor(
    private readonly networkStateService: NetworkStateService,
    private readonly sessionExpireService: SessionExpireService,
    private readonly environmentService: EnvironmentService,
    private readonly graphQLService: GraphQLService
  ) {
    this.onInit = new SyncExecutor();
    this.oldEventsSubject = new Subject();
    this.closeSubject = new Subject();
    this.openSubject = new Subject();
    this.errorSubject = new Subject();
    this.retryTimer = interval(RETRY_INTERVAL)
      .pipe(
        filter(() => !this.sessionExpireService.expired && networkStateService.state)
      );
    this.subject = webSocket({
      url: environmentService.wsEndpoint,
      closeObserver: this.closeSubject,
      openObserver: this.openSubject,
    });

    this.openSubject.subscribe(() => {
      this.onInit.execute();
    });

    this.closeSubject.subscribe(event => {
      console.info(`Websocket closed: ${event.reason}`);
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
        this.handleErrors(),
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
        this.handleErrors(),
        filter(filterFn),
        map(mapTo)
      )
      .subscribe(callback);

    return () => {
      sub.unsubscribe();
    };
  }

  multiplex<T = ISessionEvent>(
    topicId: SessionEventTopic,
    mapTo: ((event: ISessionEvent) => T)  = e => e as T
  ): Observable<T> {
    return merge(
      this.subject.multiplex(
        () => ({ id: ClientEventId.CbClientTopicSubscribe, topicId } as ITopicSubEvent),
        () => ({ id: ClientEventId.CbClientTopicUnsubscribe, topicId } as ITopicSubEvent),
        event => event.topicId === topicId
      ),
      this.oldEventsSubject,
    )
      .pipe(
        this.handleErrors(),
        map(mapTo)
      );
  }

  emit(event: ISessionEvent): this {
    this.subject.next(event);
    return this;
  }

  private handleErrors() {
    return (source: Observable<ISessionEvent>):Observable<ISessionEvent> =>  source.pipe(
      share(),
      catchError(this.errorHandler),
      retry({ delay: () =>  this.retryTimer }),
      repeat({ delay: () =>  this.retryTimer }),
    );
  }

  private errorHandler(error: any, caught: Observable<ISessionEvent>): Observable<ISessionEvent> {
    this.errorSubject.next(new ServiceError('WebSocket connection error', { cause: error }));
    return throwError(() => error);
  }
}
