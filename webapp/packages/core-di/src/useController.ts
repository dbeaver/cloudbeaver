/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  useContext, useEffect, useRef, useMemo
} from 'react';

import { appContext } from './AppContext';
import type {
  IServiceConstructor, IInitializableController, IDestructibleController, ExtractInitArgs
} from './IApp';

export function useController<T extends IInitializableController>(
  ctor: IServiceConstructor<T>,
  ...args: ExtractInitArgs<T>
): T;
export function useController<T>(ctor: IServiceConstructor<T>): T;
export function useController<T>(ctor: IServiceConstructor<T>, ...args: any[]): T {
  const app = useContext(appContext);
  const controllerRef = useRef<T>();

  useMemo(() => {
    if (controllerRef.current && isDestructibleController(controllerRef.current)) {
      controllerRef.current.destruct();
    }

    const controller = app.resolveServiceByClass(ctor);

    if (isInitializableController(controller)) {
      controller.init(...args);
    }
    controllerRef.current = controller;
  }, [...args, args.length]);
  /* we put dynamic array length as the dependency because of preact bug,
     otherwise useMemo will not be triggered on array change */

  useEffect(() => () => {
    if (isDestructibleController(controllerRef.current)) {
      controllerRef.current.destruct();
    }
  }, []);

  return controllerRef.current!;
}

function isDestructibleController(obj: any): obj is IDestructibleController {
  return obj && typeof obj.destruct === 'function';
}

function isInitializableController(obj: any): obj is IInitializableController<any[]> {
  return obj && typeof obj.init === 'function';
}
