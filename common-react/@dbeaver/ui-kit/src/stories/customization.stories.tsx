import { GlobalTokens } from './tokens.js';

export const HowToCustomize = () => {
  return (
    <div>
      <h1>How to customize</h1>
      <p>DBeaver UI Kit components have basic styles and use some defaults from Tailwind CSS. To change styling you can use different approaches.</p>
      <h2>Global CSS Tokens</h2>
      <p>
        UI kit uses several global CSS tokens described on the <a href="/?story=design-tokens--global">Global Tokens page</a>. These tokens help
        maintain consistency across the UI components. All DBeaver UI tokens are prefixed with <code>--dbv-kit-</code>. You can use these tokens to
        customize the UI kit to fit your application's design. For example, changing the <code>--dbv-kit-font-size-base</code> token will change the
        base font size for text in the UI kit. And changing the <code>--dbv-kit-control-height-base</code> token will change all control heights. If
        you don't want to change all controls, you can change <code>--dbv-kit-control-height-small</code>,{' '}
        <code>--dbv-kit-control-height-medium</code> or other tokens separately. They will affect only specific components.
      </p>
      <h2>Component CSS Tokens</h2>
      <p>
        Some components have their own tokens. For example, the Button component <a href="?story=button--7-tokens">has tokens </a> for button sizes,
        padding, and colors. You can change these tokens to customize the Button component.
      </p>
      <h2>Component CSS Classes</h2>
      <p>
        Each component in the UI kit has a default CSS class name following the <strong> dbv-kit-[component name(in lowercase)]</strong> naming
        convention that you can use to customize the component. You can find the default class name in the component's documentation.
      </p>
      For button:
      <div className="codeblock tw:p-4 tw:my-4">
        <code>
          .dbv-kit-button &#123; <br />
          /* Your custom styles */ <br /> &#125;
        </code>
      </div>
      For input:
      <div className="codeblock tw:p-4 tw:my-4">
        <code>
          .dbv-kit-input &#123; <br />
          /* Your custom styles */ <br /> &#125;
        </code>
      </div>
      <p>
        Some components have additional classes for different states or sizes. For example, the Button component has classes for different sizes:
        <code>.dbv-kit-button--small</code>, <code>.dbv-kit-button--large</code>. We use{' '}
        <a href="https://getbem.com/" target="_blank">
          BEM
        </a>{' '}
        convention for class names. If a component has a modifier, it will be separated by two dashes. If component has a child element, it will be
        separated by two underscores, for example
        <div className="codeblock">
          <code>.dbv-kit-button__icon</code> - <i> icon is a child element of the button</i>
        </div>
        <div className="codeblock">
          <code>.dbv-kit-button--large</code> - <i> large is a size modifier</i>
        </div>
        or
        <div className="codeblock">
          <code>.dbv-kit-button__icon--start</code> - <i> icon is a child element of the button and has a start placement</i>
        </div>
      </p>
      <p>
        Each component accepts the standard className and style props which enable using vanilla CSS, utility classes (e.g. Tailwind), CSS-in-JS (e.g.
        Styled Components), etc. A custom className can be specified and will be <strong>appended</strong> to a class list of a component
      </p>
      <div className="codeblock">
        <code>&lt;Button className="my-custom-button"&gt;Button&lt;Button&gt;</code>
      </div>
      <div className="codeblock">
        <code>&lt;Button style=&#123;&#123;background: red&#125;&#125;&gt;Button&lt;Button&gt;</code>
      </div>
    </div>
  );
};

export const Tokens = GlobalTokens;
