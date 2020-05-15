/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action } from 'mobx';

import { GQLError } from './GQLError';

export class GQLErrorCatcher {
  @observable hasDetails = false
  @observable responseMessage: string | null = null
  @observable exception: GQLError | null = null;

  @action catch(exception: any): boolean {
    if (exception instanceof GQLError) {
      this.responseMessage = exception.errorText;
      this.hasDetails = exception.hasDetails();
      this.exception = exception;
      return true;
    }
    this.clear();
    return false;
  }

  @action clear() {
    this.hasDetails = false;
    this.responseMessage = null;
    this.exception = null;
  }
}
