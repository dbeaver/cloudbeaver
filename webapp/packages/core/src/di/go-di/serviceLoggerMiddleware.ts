/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/* eslint-disable max-classes-per-file */
import { GetService, IGetServiceValue, IServiceValue } from 'go-di';

// eslint-disable-next-line symbol-description
const BASE = Symbol();

class GroupMessage {
  title: string
  value: any
  source: any

  constructor(title: string, value: any, source?: any) {
    this.title = title;
    this.value = value;
    this.source = source;
  }
}

class Group {
  title?: string
  source: any
  before?: Group
  buffer: ({ message: string; type: string } | GroupMessage | Group)[]

  constructor(before: Group, title?: string, source?: any) {
    this.title = title;
    this.buffer = [];
    this.before = before;
    this.source = source;
  }

  log(value: any) {
    if (!this.before) {
      console.log(value);
    } else {
      this.buffer.push({ message: value, type: 'info' });
    }
  }

  error(value: any) {
    if (!this.before) {
      console.error(value);
    } else {
      this.buffer.push({ message: value, type: 'error' });
    }
  }

  logGroup(title: string, value: any) {
    if (!this.before) {
      printMessage(new GroupMessage(title, value));
    } else {
      this.buffer.push(new GroupMessage(title, value));
    }
  }

  close() {
    currentGroup = this.before as Group;
    if (!currentGroup.before) {
      printGroup(currentGroup);
    }
  }

  discard() {
    currentGroup = this.before as Group;
  }
}

function openGroup(title?: string, source?: any) {
  const group = new Group(currentGroup, title, source);

  if (currentGroup) {
    currentGroup.buffer.push(group);
  }
  currentGroup = group;

  return group;
}

function printMessage({ title, value, source }: GroupMessage) {
  console.groupCollapsed(title);
  if (typeof source === 'function') {
    console.groupCollapsed('Source');
    console.log(source);
    console.groupEnd();
  }
  console.log(value);
  console.groupEnd();
}

function printGroup(group: Group) {
  if (group.before) {
    console.groupCollapsed(group.title);
    if (typeof group.source === 'function') {
      console.groupCollapsed('Source');
      console.log(group.source);
      console.groupEnd();
    }
  }
  for (const message of group.buffer) {
    if (message instanceof Group) {
      printGroup(message);
    } else if (message instanceof GroupMessage) {
      printMessage(message);
    } else if (message.type === 'info') {
      console.log(message.message);
    } else {
      console.error(message.message);
    }
  }
  // eslint-disable-next-line no-param-reassign
  group.buffer = [];
  if (group.before) {
    console.groupEnd();
  }
}

function filterArgs(f: any) {
  return typeof f === 'object'
    ? JSON.stringify(f, undefined, 2)
    : filterFunction(f);
}

function filterFunction(f: any) {
  return typeof f === 'function' ? 'ƒ' : f;
}

function proxyFunction<T>(
  object: any,
  func: any,
  prefix: string,
  name: string | number | symbol,
) {
  return (...args: any) => {
    const scope = openGroup(
      `${prefix}${name as string}(${args.map(filterArgs).join(', ')})`,
      func,
    );
    const val = object ? object[name](...args) : func(...args);
    if (val instanceof Promise) {
      val
        .then((v) => {
          scope.log(filterFunction(v));
          scope.close();
        })
        .catch((v) => {
          scope.error(filterFunction(v));
          scope.close();
        });
    } else {
      scope.log(filterFunction(val));
      scope.close();
    }
    return val;
  };
}

function proxyService(value: any, serviceName: string) {
  return new Proxy(
    {
      [BASE]: value,
    } as any,
    {
      get(target, name) {
        if (name === BASE) {
          return target[name];
        }
        const source = target[BASE];

        if (typeof source[name] === 'function') {
          if (target[name] === undefined) {
            // eslint-disable-next-line no-param-reassign
            target[name] = proxyFunction(source, source[name], `${serviceName}.`, name);
          }
          return target[name];
        }
        currentGroup.logGroup(`${serviceName}.${name as string}`, source[name]);
        return source[name];
      },
    },
  );
}

let currentGroup: Group = undefined as any;
openGroup();

export function serviceLoggerMiddleware<T>(
  service: IServiceValue<T>,
  params: any[],
  getValue: IGetServiceValue<T>,
): GetService<T> {
  const serviceName = service.getName();

  const scope = openGroup(
    `${serviceName}(${params.map(filterArgs).join(', ')})`,
    service.service,
  );

  const value = getValue(service, params) as any;
  scope.log(value[BASE] || value);
  scope.close();

  if (value[BASE] !== undefined) {
    return value;
  }

  switch (typeof value) {
    case 'object':
      return proxyService(value, serviceName);
    case 'function': {
      const func = proxyFunction(undefined, value, '', serviceName) as any;
      func[BASE] = value;
      return func;
    }
  }
  return value;
}
