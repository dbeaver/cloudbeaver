import { observable } from 'mobx';

import { ENotificationType, IProcessNotificationState } from './INotification';

export class ProcessNotificationController implements IProcessNotificationState {
  @observable processing: boolean;
  @observable response: string;
  @observable error: Error | null;
  @observable title: string;
  @observable message: string;
  @observable status: ENotificationType;

  constructor() {
    this.processing = false;
    this.response = '';
    this.error = null;
    this.title = '';
    this.message = '';
    this.status = ENotificationType.Info;
  }

  init(title: string) {
    this.status = ENotificationType.Loading;
    this.title = title;
    this.processing = true;
  }

  resolve(title: string, res: string) {
    this.status = ENotificationType.Success;
    this.title = title;
    this.response = res;
    this.message = res;
    this.processing = false;
  }

  reject(e: Error, title?: string, message?: string) {
    this.status = ENotificationType.Error;
    this.title = title || e.name;
    this.message = message || e.message;
    this.error = e;
    this.processing = false;
  }
}
