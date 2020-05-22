/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';

import { ScreenService } from '../Screen/ScreenService';
import { AppScreen } from './AppScreen';

@injectable()
export class AppScreenService {

  constructor(
    private screenService: ScreenService
  ) {}

  register() {
    this.screenService.add({ name: 'app', path: '/', component: AppScreen });
  }
}
