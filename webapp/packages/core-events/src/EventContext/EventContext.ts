/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const eventContext: unique symbol = Symbol('event-context');
const typeSaver: unique symbol = Symbol('event-context-typeSaver');

export interface IEventFlag<T> {
  name: string;
  [typeSaver]?: T;
}

interface IEventMark<T> {
  flag: IEventFlag<T>;
  context: T;
}

interface IEventWithContext {
  [eventContext]: Array<IEventMark<any>>;
}

interface IEventContext {
  set: <TEvent, TContext= void>(
    event: TEvent | IEventWithContext,
    flag: IEventFlag<TContext>,
    context?: TContext
  ) => IEventContext;
  has: <TEvent>(
    event: TEvent | IEventWithContext,
    ...flags: Array<IEventFlag<any>>
  ) => boolean;
  get: <TEvent, TContext>(
    event: TEvent | IEventWithContext,
    flag: IEventFlag<TContext>
  ) => TContext | undefined;
  create: <T = void>(name: string) => IEventFlag<T>;
}

export const EventContext: IEventContext = {
  set<TEvent, TContext= void>(event: TEvent | IEventWithContext, flag: IEventFlag<TContext>, context: TContext) {
    event = addContextToEvent(event);

    const mark = event[eventContext].find(mark => mark.flag === flag);

    if (mark) {
      mark.context = context;
      return this;
    }

    event[eventContext].push({ flag, context });

    return this;
  },
  has<TEvent>(event: TEvent | IEventWithContext, ...flags: Array<IEventFlag<any>>) {
    event = addContextToEvent(event);

    return flags.some(flag => (event as IEventWithContext)[eventContext].some(mark => mark.flag === flag));
  },
  get<TEvent, TContext>(event: TEvent | IEventWithContext, flag: IEventFlag<TContext>) {
    event = addContextToEvent(event);

    const mark = event[eventContext].find(mark => mark.flag === flag);

    return mark?.context;
  },
  create(name: string) {
    return { name };
  },
};

function addContextToEvent(obj: any): IEventWithContext {
  if (!obj[eventContext]) {
    obj[eventContext] = [];
  }

  return obj;
}
