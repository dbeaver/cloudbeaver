import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class SessionExpireSource {
  expired: boolean;

  constructor() {
    this.expired = false;

    this.setExpired = this.setExpired.bind(this);

    makeObservable(this, {
      expired: observable,
    });
  }

  setExpired(expired: boolean): void {
    this.expired = expired;
  }
}
