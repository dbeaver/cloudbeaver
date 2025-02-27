export const Tokens = () => {
  return (
    <div className="tw:p-4 tw:my-4">
      <h1>Button CSS Tokens</h1>
      <p>This UI kit uses several CSS tokens to style buttons.</p>
      <h2>Common buttons tokens</h2>
      <section className="tw:my-4">
        <h3>Size and space</h3>
        <div>
          <code>--dbv-kit-btn-height:</code> var(--dbv-kit-control-height-medium); <span className="comment"> Default button height</span>
        </div>
        <div>
          <code>--dbv-kit-btn-padding-inline:</code> --spacing(2.5);
          <span className="comment"> Medium button inline paddings, other sizes are calculated based on that variable</span>
        </div>
        <div>
          <code>--dbv-kit-btn-gap:</code> calc(var(--dbv-kit-btn-padding-inline) /4);{' '}
          <span className="comment"> Gap between button elements (mostly text and icon) </span>
        </div>
        <div>
          <code>--dbv-kit-btn-outline-offset:</code> 1px; <span className="comment"> Button outline offset</span>
        </div>
        <h3>Basic colors</h3>
        <div>
          <code>--dbv-kit-btn-foreground:</code> var(--color-white); <span className="comment"> Default button text color</span>
        </div>
        <div>
          <code>--dbv-kit-btn-background:</code> var(--dbv-kit-color-primary-600); <span className="comment"> Default button background color</span>
        </div>
        <div>
          <code>--dbv-kit-btn-background-hover:</code> var(--dbv-kit-color-primary-700);{' '}
          <span className="comment"> Button hover background color</span>
        </div>
        <div>
          <code>--dbv-kit-btn-background-active:</code> var(--dbv-kit-color-primary-800);{' '}
          <span className="comment"> Button active background color</span>
        </div>
        <h3>Border</h3>
        <div>
          <code>--dbv-kit-btn-border-width:</code> 1px; <span className="comment"> Button border width</span>
        </div>

        <div>
          <code>--dbv-kit-btn-border-color:</code> transparent; --dbv-kit-btn-border-style: solid;{' '}
          <span className="comment"> Button border color and style</span>
        </div>
        <div>
          <code>--dbv-kit-btn-border-radius:</code> var(--radius-md); <span className="comment"> Button border radius</span>
        </div>
        <h3>Font</h3>
        <div>
          <code>--dbv-kit-btn-font-weight:</code> var(--font-weight-normal); <span className="comment"> Button font weight</span>
        </div>
        <div>
          <code>--dbv-kit-btn-font-size:</code> calc(var(--dbv-kit-font-size-base) * 0.875);{' '}
          <span className="comment"> Button font size, default for medium-sized button, other sizes calculated based on that value</span>
        </div>

        <h3>Loader</h3>
        <div>
          <code>--dbv-kit-btn-loader-base-color:</code> var(--tw-color-white);{' '}
          <span className="comment">
            // This color used in loader to mix with other button colors like{' '}
            <i> color: color-mix(in srgb, var(--dbv-kit-btn-foreground) 25%, var(--dbv-kit-btn-loader-base-color));</i> It should be light in light
            mode and one of the dark colors for dark theme.
          </span>
        </div>
        <div>
          <code>--dbv-kit-btn-loader-animation:</code> var(--animate-spin); <span className="comment"> Button loader animation</span>
        </div>
        <h3>Others</h3>
        <div>
          <code>--dbv-kit-btn-disabled-opacity:</code> 0.5; <span className="comment"> Button opacity when disabled</span>
        </div>
      </section>
      <div className="tw:my-4">
        <h2>Specific buttons tokens</h2>
        <h3>Button Sizes</h3>
        <p>
          The <code>--dbv-kit-btn-*-height</code> tokens are used to define the height of buttons for different size variants. Default buttons use{' '}
          <code>--control-height-*</code> variable as the base height.
        </p>
        <p style={{ height: 'var(--dbv-kit-btn-small-height)' }}>
          Small button height: <code>--dbv-kit-btn-small-height</code>
        </p>
        <p style={{ height: 'var(--dbv-kit-btn-medium-height)' }}>
          Medium button height: <code>--dbv-kit-btn-medium-height</code>
        </p>
        <p style={{ height: 'var(--dbv-kit-btn-large-height)' }}>
          Large button height: <code>--dbv-kit-btn-large-height</code>
        </p>
        <p style={{ height: 'var(--dbv-kit-btn-xlarge-height)' }}>
          Extra large button height: <code>--dbv-kit-btn-xlarge-height</code>
        </p>
      </div>
      <div className="tw:my-4">
        <h3>Button Padding</h3>
        <p>
          The <code>--dbv-kit-btn-*-padding-inline</code> tokens are used to define the padding of buttons for different size variants.
        </p>
        <p>
          Small button padding: <code>--dbv-kit-btn-small-padding-inline</code>
        </p>
        <p>
          Medium button padding: <code>--dbv-kit-btn-medium-padding-inline</code>
        </p>
        <p>
          Large button padding: <code>--dbv-kit-btn-large-padding-inline</code>
        </p>
        <p>
          Extra large button padding: <code>--dbv-kit-btn-xlarge-padding-inline</code>
        </p>
      </div>
      <div className="tw:my-4">
        <h3>Button Colors</h3>
        <p style={{ backgroundColor: 'var(--dbv-kit-btn-primary-background)', color: 'var(--dbv-kit-btn-primary-foreground)' }}>
          Primary button background: <code>--dbv-kit-btn-primary-background</code>
        </p>
        <p style={{ backgroundColor: 'var(--dbv-kit-btn-primary-background-hover)', color: 'var(--dbv-kit-btn-primary-foreground)' }}>
          Primary button background (hover): <code>--dbv-kit-btn-primary-background-hover</code>
        </p>
        <p style={{ backgroundColor: 'var(--dbv-kit-btn-primary-background-active)', color: 'var(--dbv-kit-btn-primary-foreground)' }}>
          Primary button background (active): <code>--dbv-kit-btn-primary-background-active</code>
        </p>
        <p style={{ backgroundColor: 'var(--dbv-kit-btn-secondary-background)', color: 'var(--dbv-kit-btn-secondary-foreground)' }}>
          Secondary button background: <code>--dbv-kit-btn-secondary-background</code>
        </p>
        <p style={{ backgroundColor: 'var(--dbv-kit-btn-secondary-background-hover)', color: 'var(--dbv-kit-btn-secondary-foreground)' }}>
          Secondary button background (hover): <code>--dbv-kit-btn-secondary-background-hover</code>
        </p>
        <p style={{ backgroundColor: 'var(--dbv-kit-btn-secondary-background-active)', color: 'var(--dbv-kit-btn-secondary-foreground)' }}>
          Secondary button background (active): <code>--dbv-kit-btn-secondary-background-active</code>
        </p>
        <p style={{ borderColor: 'var(--dbv-kit-btn-secondary-border-color)', borderWidth: '1px', borderStyle: 'solid' }}>
          Secondary button border color: <code>--dbv-kit-btn-secondary-border-color</code>
        </p>
        <p style={{ backgroundColor: 'var(--dbv-kit-btn-danger-background)', color: 'var(--dbv-kit-btn-danger-foreground)' }}>
          Danger button background: <code>--dbv-kit-btn-danger-background</code>
        </p>
        <p style={{ backgroundColor: 'var(--dbv-kit-btn-danger-background-hover)', color: 'var(--dbv-kit-btn-danger-foreground)' }}>
          Danger button background (hover): <code>--dbv-kit-btn-danger-background-hover</code>
        </p>
        <p style={{ backgroundColor: 'var(--dbv-kit-btn-danger-background-active)', color: 'var(--dbv-kit-btn-danger-foreground)' }}>
          Danger button background (active): <code>--dbv-kit-btn-danger-background-active</code>
        </p>
        <p>
          The <code>--dbv-kit-btn-*-background</code> and <code>--dbv-kit-btn-*-foreground</code> tokens are used to define the background and text
          color of buttons for different variants (primary, secondary, danger).
        </p>
        <p>
          To set another background or text color for your button, you can override the respective <code>--dbv-kit-btn-*</code> tokens in your CSS.
        </p>
      </div>
      <div className="tw:my-4">
        <h3>Button Borders</h3>
        <p style={{ borderWidth: 'var(--dbv-kit-btn-border-width)', borderColor: 'var(--dbv-kit-btn-border-color)', borderStyle: 'solid' }}>
          Button border width: <code>--dbv-kit-btn-border-width</code>
        </p>
        <p>
          The <code>--dbv-kit-btn-border-width</code> token is used to define the border width of buttons.
        </p>
        <p>
          To change the border size of your button, you can override the <code>--dbv-kit-btn-border-width</code> token in your CSS.
        </p>
      </div>
    </div>
  );
};
