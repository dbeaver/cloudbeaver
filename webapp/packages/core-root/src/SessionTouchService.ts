import { ClientActivityService } from '@cloudbeaver/core-client-activity';
import { injectable } from '@cloudbeaver/core-di';

import { SessionResource } from './SessionResource';

export const SESSION_TOUCH_TIME_PERIOD = 1000 * 60;

@injectable()
export class SessionTouchService {
  private touchSessionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly clientActivityService: ClientActivityService, private readonly sessionResource: SessionResource) {
    this.touchSession = this.touchSession.bind(this);
    this.clientActivityService.onActiveStateChange.addHandler(this.touchSession);
  }

  private touchSession = () => {
    if (this.touchSessionTimer || !this.clientActivityService.isActive) {
      return;
    }

    this.sessionResource.touchSession();

    this.touchSessionTimer = setTimeout(() => {
      if (this.touchSessionTimer) {
        clearTimeout(this.touchSessionTimer);
        this.touchSessionTimer = null;
      }
    }, SESSION_TOUCH_TIME_PERIOD);
  };
}
