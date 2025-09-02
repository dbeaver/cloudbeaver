# DBeaver UI Kit

#### The DBeaver UI Kit is a collection of reusable React components designed to help developers build consistent and visually appealing user interfaces.

## Using Ladle for Component Development

[Ladle](https://ladle.dev/) is a tool that allows you to develop, test, and document your React components in isolation. We use it to create a sandbox environment where you can interact with your components and ensure they work as expected.

To get started with Ladle in the DBeaver UI Kit, write in terminal:

```bash
yarn docs
```

Then open the provided URL to see components.

## How to Customize

DBeaver UI Kit components have basic styles and use some defaults from Tailwind CSS. To change styling, you can use different approaches.

### Global CSS Tokens

The UI kit uses several global CSS tokens described on the Global Tokens page. These tokens help maintain consistency across the UI components. All DBeaver UI tokens are prefixed with `--dbv-kit-`. You can use these tokens to customize the UI kit to fit your application's design. For example, changing the `--dbv-kit-font-size-base` token will change the base font size for text in the UI kit. Changing the `--dbv-kit-control-height-base` token will change all control heights. If you don't want to change all controls, you can change `--dbv-kit-control-height-small`, `--dbv-kit-control-height-medium`, or other tokens separately. They will affect only specific components.

### Component CSS Tokens

Some components have their own tokens. For example, the Button component has tokens for button sizes, padding, and colors. You can change these tokens to customize the Button component. To see the list of tokens, go to sources or start Ladle.

### Component CSS Classes

Each component in the UI kit has a default CSS class name following the `dbv-kit-[component name(in lowercase)]` naming convention that you can use to customize the component. You can find the default class name in the component's documentation.

For button:

```css
.dbv-kit-button {
  /* Your custom styles */
}
```

For input:

```css
.dbv-kit-input {
  /* Your custom styles */
}
```

Some components have additional classes for different states or sizes. For example, the Button component has classes for different sizes: `.dbv-kit-button--small`, `.dbv-kit-button--large`. We use the BEM convention for class names. If a component has a modifier, it will be separated by two dashes. If a component has a child element, it will be separated by two underscores, for example:

- `.dbv-kit-button__icon` - icon is a child element of the button
- `.dbv-kit-button--large` - large is a size modifier
- `.dbv-kit-button__icon--start` - icon is a child element of the button and has a start placement

Each component accepts the standard `className` and `style` props which enable using vanilla CSS, utility classes (e.g., Tailwind), CSS-in-JS (e.g., Styled Components), etc. A custom `className` can be specified and will be appended to a class list of a component:

```jsx
<Button className="my-custom-button">Button</Button>
```

```jsx
<Button style={{ background: 'red' }}>Button</Button>
```
