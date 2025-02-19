import { Meta } from '@ladle/react';

export default {
  title: 'Design Tokens',
} as Meta;

export const GlobalTokens = () => {
  return (
    <div className="p-4 my-4">
      <h1 className="text-2xl font-bold">Global CSS Tokens</h1>
      <p className="text-base">
        This UI kit uses several global CSS tokens defined in the <code>index.css</code> file. These tokens help maintain consistency across the UI
        components. All DBeaver UI tokens are prefixed with <code>--dbv-kit-</code>. You can use these tokens to customize the UI kit to fit your
        application's design. Below are some of the key tokens used in the UI kit.
      </p>
      <div className="my-4">
        <h2 className="text-xl font-semibold">Font Size</h2>
        <p className="text-base" style={{ fontSize: 'var(--dbv-kit-font-size-base)' }}>
          Base font size: <code>--dbv-kit-font-size-base</code>
        </p>
        <p className="text-base">
          The <code>--dbv-kit-font-size-base</code> token is used to set the base font size for text in the UI kit. It ensures consistent typography
          across different components.
        </p>
      </div>

      <div className="my-4">
        <h2 className="text-xl font-semibold">Control Heights</h2>
        <p className="text-base" style={{ height: 'var(--dbv-kit-control-height-small)', backgroundColor: 'var(--dbv-kit-color-background)' }}>
          Small control height: <code>--dbv-kit-control-height-small</code>
        </p>
        <p className="text-base" style={{ height: 'var(--dbv-kit-control-height-medium)', backgroundColor: 'var(--dbv-kit-color-background)' }}>
          Medium control height: <code>--dbv-kit-control-height-medium</code>
        </p>
        <p className="text-base" style={{ height: 'var(--dbv-kit-control-height-large)', backgroundColor: 'var(--dbv-kit-color-background)' }}>
          Large control height: <code>--dbv-kit-control-height-large</code>
        </p>
        <p className="text-base" style={{ height: 'var(--dbv-kit-control-height-xlarge)', backgroundColor: 'var(--dbv-kit-color-background)' }}>
          Extra large control height: <code>--dbv-kit-control-height-xlarge</code>
        </p>
        <p className="text-base">
          The <code>--control-height-*</code> tokens are used to define the height of various UI controls, such as buttons, selects, and input fields.
          These tokens ensure consistent sizing across different components. Use these tokens to set the height of controls in your application.
        </p>
      </div>
      <div className="my-4">
        <h2 className="text-xl font-semibold">Base Sizes</h2>
        <p className="text-base">
          The <code>--dbv-kit-font-size-base</code> and <code>--dbv-kit-control-height-base</code> tokens use <code>rem</code> units by default. This
          ensures that the base font size and control height are consistent with the user's browser settings. If the user changes the browser's font
          size, these base sizes will adjust accordingly, maintaining a consistent view.
        </p>
        <p className="text-base">
          Other font sizes and control heights are calculated from these base sizes, ensuring proportional scaling across the UI components.
        </p>
      </div>
      <div className="my-4">
        <h2 className="text-xl font-semibold">Colors</h2>
        <p className="text-base" style={{ color: 'var(--dbv-kit-color-foreground)' }}>
          Foreground color: <code>--dbv-kit-color-foreground</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--dbv-kit-color-background)' }}>
          Background color: <code>--dbv-kit-color-background</code>
        </p>
        <p className="text-base" style={{ color: 'var(--dbv-kit-color-text)' }}>
          Text color: <code>--dbv-kit-color-text</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--dbv-kit-color-primary-50)' }}>
          Primary color (50): <code>--dbv-kit-color-primary-50</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--dbv-kit-color-primary-100)' }}>
          Primary color (100): <code>--dbv-kit-color-primary-100</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--dbv-kit-color-primary-200)' }}>
          Primary color (200): <code>--dbv-kit-color-primary-200</code>
        </p>
        <p className="text-base text-white" style={{ backgroundColor: 'var(--dbv-kit-color-primary-500)' }}>
          Primary color (500): <code>--dbv-kit-color-primary-500</code>
        </p>
        <p className="text-base text-white" style={{ backgroundColor: 'var(--dbv-kit-color-primary-600)' }}>
          Primary color (600): <code>--dbv-kit-color-primary-600</code>
        </p>
        <p className="text-base text-white" style={{ backgroundColor: 'var(--dbv-kit-color-primary-700)' }}>
          Primary color (700): <code>--dbv-kit-color-primary-700</code>
        </p>
        <p className="text-base text-white" style={{ backgroundColor: 'var(--dbv-kit-color-primary-800)' }}>
          Primary color (800): <code>--dbv-kit-color-primary-800</code>
        </p>
        <p className="text-base text-white" style={{ backgroundColor: 'var(--dbv-kit-color-primary-900)' }}>
          Primary color (900): <code>--dbv-kit-color-primary-900</code>
        </p>
        <p
          className="text-base my-1"
          style={{
            backgroundColor: 'var(--dbv-kit-color-error-background)',
            color: 'var(--dbv-kit-color-error-text)',
            border: '2px solid  var(--dbv-kit-color-error-border)',
          }}
        >
          Error color: <code>--dbv-kit-color-error-background</code> / <code>--dbv-kit-color-error-text</code> /{' '}
          <code>--dbv-kit-color-error-border</code>
        </p>
        <p
          className="text-base my-1"
          style={{
            backgroundColor: 'var(--dbv-kit-color-info-background)',
            color: 'var(--dbv-kit-color-info-text)',
            border: '2px solid var(--dbv-kit-color-info-border)',
          }}
        >
          Info color: <code>--dbv-kit-color-info-background</code> / <code>--dbv-kit-color-info-text</code> / <code>--dbv-kit-color-info-border</code>
        </p>
        <p
          className="text-base my-1"
          style={{
            backgroundColor: 'var(--dbv-kit-color-warning-background)',
            color: 'var(--dbv-kit-color-warning-text)',
            border: '2px solid var(--dbv-kit-color-warning-border)',
          }}
        >
          Warning color: <code>--dbv-kit-color-warning-background</code> / <code>--dbv-kit-color-warning-text</code> /{' '}
          <code>--dbv-kit-color-warning-border</code>
        </p>
      </div>
    </div>
  );
};

GlobalTokens.storyName = 'Global';

export const ButtonTokens = () => {
  return (
    <div className="p-4 my-4">
      <h1 className="text-2xl font-bold">Button CSS Tokens</h1>
      <p className="text-base">This UI kit uses several CSS tokens to style buttons.</p>
      <h2 className="text-xl font-semibold">Common buttons tokens</h2>
      <div className="my-4">
        <div>
          <code>--dbv-kit-btn-height:</code> var(--dbv-kit-control-height-medium); <span className="comment">// Default button height</span>
        </div>
        <div>
          <code>--dbv-kit-btn-padding-inline:</code> --spacing(2.5);
          <span className="comment"> // Medium button inline paddings, other sizes are calculated based on that variable</span>
        </div>
        <div>
          <code>--dbv-kit-btn-gap:</code> calc(var(--dbv-kit-btn-padding-inline) /4);{' '}
          <span className="comment"> // Gap between button elements (mostly text and icon) </span>
        </div>
        <div>
          <code>--dbv-kit-btn-foreground:</code> var(--color-white); <span className="comment">// Default button text color</span>
        </div>
        <div>
          <code>--dbv-kit-btn-background:</code> var(--dbv-kit-color-primary-600); <span className="comment">// Default button background color</span>
        </div>
        <div>
          <code>--dbv-kit-btn-background-hover:</code> var(--dbv-kit-color-primary-700);{' '}
          <span className="comment">// Button hover background color</span>
        </div>
        <div>
          <code>--dbv-kit-btn-background-active:</code> var(--dbv-kit-color-primary-800);{' '}
          <span className="comment">// Button active background color</span>
        </div>
        <div>
          <code>--dbv-kit-btn-border-width:</code> 1px; <span className="comment">// Button border width</span>
        </div>
        <div>
          <code>--dbv-kit-btn-border-color:</code> transparent; --dbv-kit-btn-border-style: solid;{' '}
          <span className="comment">// Button border color and style</span>
        </div>
        <div>
          <code>--dbv-kit-btn-radius:</code> var(--radius-md); <span className="comment">// Button border radius</span>
        </div>
        <div>
          <code>--dbv-kit-btn-font-weight:</code> var(--font-weight-normal); <span className="comment">// Button font weight</span>
        </div>
        <div>
          <code>--dbv-kit-btn-font-size:</code> calc(var(--dbv-kit-font-size-base) * 0.875);{' '}
          <span className="comment">// Button font size, default for medium-sized button, other sizes calculated based on that value</span>
        </div>
        <div>
          <code>--dbv-kit-btn-disabled-opacity:</code> 0.5; <span className="comment">// Button opacity when disabled</span>
        </div>
        <div>
          <code>--dbv-kit-btn-loader-animation:</code> var(--animate-spin); <span className="comment">// Button loader animation</span>
        </div>
      </div>
      <div className="my-4">
        <h2 className="text-xl font-semibold">Specific buttons tokens</h2>
        <h3 className="text-lg font-semibold">Button Sizes</h3>
        <p className="text-base" style={{ height: 'var(--dbv-kit-btn-small-height)', backgroundColor: 'var(--dbv-kit-btn-background)' }}>
          Small button height: <code>--dbv-kit-btn-small-height</code>
        </p>
        <p className="text-base" style={{ height: 'var(--dbv-kit-btn-medium-height)', backgroundColor: 'var(--dbv-kit-btn-background)' }}>
          Medium button height: <code>--dbv-kit-btn-medium-height</code>
        </p>
        <p className="text-base" style={{ height: 'var(--dbv-kit-btn-large-height)', backgroundColor: 'var(--dbv-kit-btn-background)' }}>
          Large button height: <code>--dbv-kit-btn-large-height</code>
        </p>
        <p className="text-base" style={{ height: 'var(--dbv-kit-btn-xlarge-height)', backgroundColor: 'var(--dbv-kit-btn-background)' }}>
          Extra large button height: <code>--dbv-kit-btn-xlarge-height</code>
        </p>
        <p className="text-base">
          The <code>--dbv-kit-btn-*-height</code> tokens are used to define the height of buttons for different size variants. Default buttons use{' '}
          <code>--control-height-*</code> variable as the base height.
        </p>
      </div>
      <div className="my-4">
        <h3 className="text-lg font-semibold">Button Padding</h3>
        <p
          className="text-base"
          style={{ paddingInline: 'var(--dbv-kit-btn-small-padding-inline)', backgroundColor: 'var(--dbv-kit-btn-background)' }}
        >
          Small button padding: <code>--dbv-kit-btn-small-padding-inline</code>
        </p>
        <p
          className="text-base"
          style={{ paddingInline: 'var(--dbv-kit-btn-medium-padding-inline)', backgroundColor: 'var(--dbv-kit-btn-background)' }}
        >
          Medium button padding: <code>--dbv-kit-btn-medium-padding-inline</code>
        </p>
        <p
          className="text-base"
          style={{ paddingInline: 'var(--dbv-kit-btn-large-padding-inline)', backgroundColor: 'var(--dbv-kit-btn-background)' }}
        >
          Large button padding: <code>--dbv-kit-btn-large-padding-inline</code>
        </p>
        <p
          className="text-base"
          style={{ paddingInline: 'var(--dbv-kit-btn-xlarge-padding-inline)', backgroundColor: 'var(--dbv-kit-btn-background)' }}
        >
          Extra large button padding: <code>--dbv-kit-btn-xlarge-padding-inline</code>
        </p>
        <p className="text-base">
          The <code>--dbv-kit-btn-*-padding-inline</code> tokens are used to define the padding of buttons for different size variants.
        </p>
      </div>
      <div className="my-4">
        <h3 className="text-lg font-semibold">Button Colors</h3>
        <p className="text-base" style={{ backgroundColor: 'var(--dbv-kit-btn-primary-background)', color: 'var(--dbv-kit-btn-primary-foreground)' }}>
          Primary button background: <code>--dbv-kit-btn-primary-background</code>
        </p>
        <p
          className="text-base"
          style={{ backgroundColor: 'var(--dbv-kit-btn-primary-background-hover)', color: 'var(--dbv-kit-btn-primary-foreground)' }}
        >
          Primary button background (hover): <code>--dbv-kit-btn-primary-background-hover</code>
        </p>
        <p
          className="text-base"
          style={{ backgroundColor: 'var(--dbv-kit-btn-primary-background-active)', color: 'var(--dbv-kit-btn-primary-foreground)' }}
        >
          Primary button background (active): <code>--dbv-kit-btn-primary-background-active</code>
        </p>
        <p
          className="text-base"
          style={{ backgroundColor: 'var(--dbv-kit-btn-secondary-background)', color: 'var(--dbv-kit-btn-secondary-foreground)' }}
        >
          Secondary button background: <code>--dbv-kit-btn-secondary-background</code>
        </p>
        <p
          className="text-base"
          style={{ backgroundColor: 'var(--dbv-kit-btn-secondary-background-hover)', color: 'var(--dbv-kit-btn-secondary-foreground)' }}
        >
          Secondary button background (hover): <code>--dbv-kit-btn-secondary-background-hover</code>
        </p>
        <p
          className="text-base"
          style={{ backgroundColor: 'var(--dbv-kit-btn-secondary-background-active)', color: 'var(--dbv-kit-btn-secondary-foreground)' }}
        >
          Secondary button background (active): <code>--dbv-kit-btn-secondary-background-active</code>
        </p>
        <p className="text-base" style={{ borderColor: 'var(--dbv-kit-btn-secondary-border-color)', borderWidth: '1px', borderStyle: 'solid' }}>
          Secondary button border color: <code>--dbv-kit-btn-secondary-border-color</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--dbv-kit-btn-danger-background)', color: 'var(--dbv-kit-btn-danger-foreground)' }}>
          Danger button background: <code>--dbv-kit-btn-danger-background</code>
        </p>
        <p
          className="text-base"
          style={{ backgroundColor: 'var(--dbv-kit-btn-danger-background-hover)', color: 'var(--dbv-kit-btn-danger-foreground)' }}
        >
          Danger button background (hover): <code>--dbv-kit-btn-danger-background-hover</code>
        </p>
        <p
          className="text-base"
          style={{ backgroundColor: 'var(--dbv-kit-btn-danger-background-active)', color: 'var(--dbv-kit-btn-danger-foreground)' }}
        >
          Danger button background (active): <code>--dbv-kit-btn-danger-background-active</code>
        </p>
        <p className="text-base">
          The <code>--dbv-kit-btn-*-background</code> and <code>--dbv-kit-btn-*-foreground</code> tokens are used to define the background and text
          color of buttons for different variants (primary, secondary, danger).
        </p>
        <p className="text-base">
          To set another background or text color for your button, you can override the respective <code>--dbv-kit-btn-*</code> tokens in your CSS.
        </p>
      </div>
      <div className="my-4">
        <h3 className="text-lg font-semibold">Button Borders</h3>
        <p
          className="text-base"
          style={{ borderWidth: 'var(--dbv-kit-btn-border-width)', borderColor: 'var(--dbv-kit-btn-border-color)', borderStyle: 'solid' }}
        >
          Button border width: <code>--dbv-kit-btn-border-width</code>
        </p>
        <p className="text-base">
          The <code>--dbv-kit-btn-border-width</code> token is used to define the border width of buttons.
        </p>
        <p className="text-base">
          To change the border size of your button, you can override the <code>--dbv-kit-btn-border-width</code> token in your CSS.
        </p>
      </div>
    </div>
  );
};

ButtonTokens.storyName = 'Buttons';
