const Environment = require('jest-environment-jsdom').default;

/** 
  JSDOM does not have an implementation for TextDecoder / TextEncoder present on their globals 
  and therefore not only are they not found, but you can't add them without access to their global context inside the VM.
  MSW 2.0 related issue.
*/
module.exports = class CustomTestEnvironment extends Environment {
  async setup() {
    await super.setup();
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
    this.global.Response = Response;
    this.global.Request = Request;
    // FIXME https://github.com/jsdom/jsdom/issues/3363
    this.global.structuredClone = structuredClone;

    // different machine has its own timezones and some tests can fail because of it
    process.env.TZ = 'UTC';
  }
};
