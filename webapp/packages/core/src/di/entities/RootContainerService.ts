/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DIContainer } from '../DIContainer';
import { Entity } from './Entity';

/**
 * The service allows to register new child container in Root Scope
 * Method 'register' will be added during app bootstrap when root container is created
 */
export class RootContainerService {

  private readonly register: (container: DIContainer) => void;

  constructor(register: (container: DIContainer) => void) {
    this.register = register;
  }

  registerEntityInRootContainer(entity: Entity) {
    // entity.container is a protected property and it is the only place where the protection should be broken
    // eslint-disable-next-line dot-notation
    this.register(entity['container']);
  }

}
