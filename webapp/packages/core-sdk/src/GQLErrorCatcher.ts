/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action, makeObservable } from 'mobx';

import { errorOf } from '@cloudbeaver/core-utils';

import { DetailsError } from './DetailsError';

export class GQLErrorCatcher {
  hasDetails = false;
  responseMessage: string | null = null;
  exception: DetailsError | null = null;

  constructor() {
    makeObservable(this, {
      hasDetails: observable,
      responseMessage: observable,
      exception: observable,
      catch: action,
      clear: action,
    });
  }

  catch(exception: any): boolean {
    const detailsError = errorOf(exception, DetailsError);
    if (detailsError) {
      this.responseMessage = detailsError.message;
      this.hasDetails = detailsError.hasDetails();
      this.exception = detailsError;
      return true;
    }
    this.clear();
    return false;
  }

  clear() {
    this.hasDetails = false;
    this.responseMessage = null;
    this.exception = null;
  }
}
