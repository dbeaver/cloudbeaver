/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  catchError,
  concatMap,
  debounceTime,
  defer,
  delayWhen,
  filter,
  from,
  interval,
  map,
  merge,
  Observable,
  type Observer,
  of,
  repeat,
  retry,
  share,
  shareReplay,
  Subject,
  switchMap,
  throwError,
} from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor, type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import {
  CbClientEventId as ClientEventId,
  EnvironmentService,
  CbServerEventId as ServerEventId,
  ServiceError,
  CbEventTopic as SessionEventTopic,
} from '@cloudbeaver/core-sdk';

import { NetworkStateService } from './NetworkStateService.js';
import type { IBaseServerEvent, IServerEventCallback, IServerEventEmitter, Unsubscribe } from './ServerEventEmitter/IServerEventEmitter.js';
import { SessionExpireService } from './SessionExpireService.js';

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
export class SessionEventSource implements IServerEventEmitter<ISessionEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  readonly eventsSubject: Observable<ISessionEvent>;
  readonly onActivate: IExecutor;
  readonly onInit: ISyncExecutor;

  private readonly closeSubject: Subject<CloseEvent>;
  private readonly openSubject: Subject<Event>;
  private readonly errorSubject: Subject<Error>;
  private readonly subject: WebSocketSubject<ISessionEvent>;
  private readonly oldEventsSubject: Subject<ISessionEvent>;
  private readonly emitSubject: Subject<ISessionEvent>;
  private readonly retryTimer: Observable<number>;
  private readonly disconnectSubject: Subject<boolean>;
  private disconnected: boolean;

  constructor(
    networkStateService: NetworkStateService,
    private readonly sessionExpireService: SessionExpireService,
    environmentService: EnvironmentService,
  ) {
    this.onActivate = new Executor();
    this.onInit = new SyncExecutor();
    this.oldEventsSubject = new Subject();
    this.disconnectSubject = new Subject();
    this.closeSubject = new Subject();
    this.openSubject = new Subject();
    this.errorSubject = new Subject();
    this.disconnected = false;
    this.retryTimer = interval(RETRY_INTERVAL).pipe(
      filter(() => !this.sessionExpireService.expired && networkStateService.state && !this.disconnected),
    );
    this.subject = webSocket({
      url: environmentService.wsEndpoint,
      closeObserver: this.closeSubject,
      openObserver: this.openSubject,
    });

    const ready$ = defer(() => from(this.onActivate.execute())).pipe(shareReplay(1));

    this.emitSubject = new Subject();
    this.emitSubject
      .pipe(
        this.handleDisconnected(),
        concatMap(value => ready$.pipe(concatMap(() => from([value])))),
      )
      .subscribe(this.subject);

    this.openSubject.subscribe(() => {
      this.onInit.execute();
    });

    this.closeSubject.subscribe(event => {
      console.warn(`Websocket closed (${event.code}): ${event.reason}`);
    });

    this.eventsSubject = merge(this.oldEventsSubject, ready$.pipe(switchMap(() => this.subject))).pipe(this.handleErrors());

    this.errorSubject.pipe(debounceTime(1000)).subscribe(error => {
      console.error('Websocket:', error);
    });

    this.errorHandler = this.errorHandler.bind(this);
  }

  onEvent<T = ISessionEvent>(id: SessionEventId, callback: IServerEventCallback<T>, mapTo: (event: ISessionEvent) => T = e => e as T): Unsubscribe {
    const sub = this.eventsSubject
      .pipe(
        filter(event => event.id === id),
        map(mapTo),
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
  ): Unsubscribe {
    const sub = this.eventsSubject.pipe(filter(filterFn), map(mapTo)).subscribe(callback);

    return () => {
      sub.unsubscribe();
    };
  }

  multiplex<T = ISessionEvent>(topicId: SessionEventTopic, mapTo: (event: ISessionEvent) => T = e => e as T): Observable<T> {
    return new Observable((observer: Observer<T>) => {
      try {
        this.emitSubject.next({ id: ClientEventId.CbClientTopicSubscribe, topicId } as ITopicSubEvent);
      } catch (err) {
        observer.error(err);
      }

      const subscription = this.eventsSubject.subscribe({
        next: x => {
          try {
            if (x.topicId === topicId) {
              observer.next(mapTo(x));
            }
          } catch (err) {
            observer.error(err);
          }
        },
        error: err => observer.error(err),
        complete: () => observer.complete(),
      });

      return () => {
        try {
          this.emitSubject.next({ id: ClientEventId.CbClientTopicUnsubscribe, topicId } as ITopicSubEvent);
        } catch (err) {
          observer.error(err);
        }
        subscription.unsubscribe();
      };
    });
  }

  emit(event: ISessionEvent): this {
    this.emitSubject.next(event);
    return this;
  }

  connect() {
    this.disconnected = false;
    this.disconnectSubject.next(this.disconnected);
  }

  disconnect() {
    this.disconnected = true;
    this.disconnectSubject.next(this.disconnected);
  }

  private handleDisconnected() {
    return delayWhen<ISessionEvent>(() => {
      if (this.disconnected) {
        return this.disconnectSubject.pipe(filter(disconnected => !disconnected));
      }
      return of(true);
    });
  }

  private handleErrors() {
    return (source: Observable<ISessionEvent>): Observable<ISessionEvent> =>
      source.pipe(share(), catchError(this.errorHandler), retry({ delay: () => this.retryTimer }), repeat({ delay: () => this.retryTimer }));
  }

  private errorHandler(error: any, caught: Observable<ISessionEvent>): Observable<ISessionEvent> {
    this.errorSubject.next(new ServiceError('WebSocket connection error', { cause: error }));
    return throwError(() => error);
  }
}
