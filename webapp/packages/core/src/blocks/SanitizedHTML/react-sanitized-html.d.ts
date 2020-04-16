declare module 'react-sanitized-html' {

  import { Component } from 'react';

  interface ReactSanitizedHtmlProps {
    html: string;
    // see https://github.com/apostrophecms/sanitize-html documentation
    allowedTags?: string[];
    nonTextTags?: string[];
  }

  export default class ReactSanitizedHtml extends Component<ReactSanitizedHtmlProps, any> {
  }
}
