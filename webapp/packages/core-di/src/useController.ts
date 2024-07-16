/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useMemo, useRef } from 'react';

import { App } from './App';
import type { ExtractInitArgs, IDestructibleController, IInitializableController, IServiceConstructor } from './IApp';
import { useService } from './useService';

/**
 * @deprecated use hooks instead
 */
export function useController<T extends IInitializableController>(ctor: IServiceConstructor<T>, ...args: ExtractInitArgs<T>): T;
/**
 * @deprecated use hooks instead
 */
export function useController<T>(ctor: IServiceConstructor<T>): T;
/**
 * @deprecated use hooks instead
 */
export function useController<T>(ctor: IServiceConstructor<T>, ...args: any[]): T {
  const appService = useService(App);
  const controllerRef = useRef<T>();

  useMemo(() => {
    if (controllerRef.current && isDestructibleController(controllerRef.current)) {
      controllerRef.current.destruct();
    }

    const controller = appService.getServiceInjector().resolveServiceByClass(ctor);

    if (isInitializableController(controller)) {
      controller.init(...args);
    }
    controllerRef.current = controller;
  }, [...args, args.length]);
  /* we put dynamic array length as the dependency because of preact bug,
     otherwise useMemo will not be triggered on array change */

  useEffect(
    () => () => {
      if (isDestructibleController(controllerRef.current)) {
        controllerRef.current.destruct();
      }
    },
    [],
  );

  return controllerRef.current!;
}

function isDestructibleController(obj: any): obj is IDestructibleController {
  return obj && typeof obj.destruct === 'function';
}

function isInitializableController(obj: any): obj is IInitializableController {
  return obj && typeof obj.init === 'function';
}
