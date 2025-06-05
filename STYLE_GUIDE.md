# Style Guide

This project prefers component-based or BEM-style classes for styling. Avoid using utility classes such as `mb-*`, `mt-*`, or `mr-*` for margins. Instead, define or extend component classes when spacing is needed, or apply inline styles for single-use cases.

The goal is to keep CSS maintainable and descriptive, so class names should reflect the component they style.


Status colors are defined with CSS variables like --color-status-experience-ok-border. Use these variables when styling status displays.
