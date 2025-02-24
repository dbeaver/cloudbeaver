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
        Some components have their own tokens. For example, the Button component <a href="?story=design-tokens--buttons">has tokens </a> for button
        sizes, padding, and colors. You can change these tokens to customize the Button component. Search for the component you want to customize in
        Design Tokens section.
      </p>
      <h2>Component CSS Classes</h2>
      <p>
        Each component accepts the standard className and style props which enable using vanilla CSS, utility classes (e.g. Tailwind), CSS-in-JS (e.g.
        Styled Components), etc. Each component in the UI kit has a default CSS class name following the dbv-kit-[componentName(lowercase)] naming
        convention that you can use to customize the component.
      </p>
      <div className="tw:bg-gray-100 tw:p-4 tw:my-4">
        <code>
          .dbv-kit-button &#123; <br />
          /* Your custom styles */ <br /> &#125;
        </code>
      </div>

      <p>
        A custom className can be specified and will be <strong>appended</strong> to a class list of a component
      </p>
      <div className="tw:bg-gray-100 tw:p-4 tw:my-4">
        <code>&lt;Button className="my-custom-button" /&gt;</code>
      </div>
    </div>
  );
};

export const Tokens = GlobalTokens;
