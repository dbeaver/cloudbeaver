---
to: <%= name %>/src/index.ts
---
import { <%= h.changeCase.camel(name) %> } from './manifest.js';

export default <%= h.changeCase.camel(name) %>;
export { <%= h.changeCase.camel(name) %> };