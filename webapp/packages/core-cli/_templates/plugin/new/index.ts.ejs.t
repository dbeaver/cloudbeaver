---
to: <%= name %>/src/index.ts
---
import { <%= h.changeCase.camel(name) %>Manifest } from './manifest.js';

export default <%= h.changeCase.camel(name) %>Manifest;
export { <%= h.changeCase.camel(name) %>Manifest };