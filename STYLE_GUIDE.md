# Style Guide

This project prefers component-based or BEM-style classes for styling. Avoid using utility classes such as `mb-*`, `mt-*`, or `mr-*` for margins. Instead, define or extend component classes when spacing is needed, or apply inline styles for single-use cases.

The goal is to keep CSS maintainable and descriptive, so class names should reflect the component they style.
All component specific styles must live in the Vue file for that component under a `<style scoped>` block. Only
global layout, base resets, and design tokens remain in the global CSS files (`_variables.css`, `_base.css`, `_layout.css`).
Strict BEM naming is not mandatory inside components; prefer short and clear class names.



## CSS variables

- Define every color and common shadow as a CSS variable under `:root`.
- Reuse these variables instead of hard coded values.
- Status colors are defined with CSS variables like --color-status-experience-ok-border. 
## Responsive design

- Breakpoints are generally `768px` and `480px`.
- Layouts should be flexible so content adapts at those widths.

## Naming pattern

- Classes follow the BEM style: `block__element--modifier`.
- Example: `.menu__item--active`.
- Limit the use of ID selectors to cases like anchors or JavaScript hooks.

Inline styles are allowed only for one-off adjustments that do not warrant a new class.

Avoid `!important` unless absolutely necessary and record the reason when used.
