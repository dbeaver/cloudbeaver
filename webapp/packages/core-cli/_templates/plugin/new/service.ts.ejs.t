---
to: <%= name %>/src/<%= h.changeCase.pascal(name) %>Bootstrap.ts
---
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

@injectable()
export class <%= h.changeCase.pascal(name) %>Bootstrap extends Bootstrap {
  constructor() {
    super();
  }

  override register() {
    console.log('<%= h.changeCase.no(name) %> is registered');
  }
}