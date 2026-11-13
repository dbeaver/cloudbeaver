---
to: <%= name %>/src/<%= h.changeCase.pascal(name) %>Bootstrap.ts
---
import { Context, Layer } from '@cloudbeaver/core-di';

export class <%= h.changeCase.pascal(name) %>Bootstrap extends Context.Service<
  <%= h.changeCase.pascal(name) %>Bootstrap,
  { register(): void }
>()('@cloudbeaver/<%= name %>/<%= h.changeCase.pascal(name) %>Bootstrap') {
  static readonly layer = Layer.succeed(this, {
    register() {},
  });
}
