export function calculateStepClasses(load) {
  const classes = [];
  for (let i = 1; i <= 15; i++) {
    if (i <= load) {
      if (i <= 5) classes.push("load-indicator__step--on-normal");
      else if (i <= 10) classes.push("load-indicator__step--on-light");
      else classes.push("load-indicator__step--on-heavy");
    } else {
      if (i <= 5) classes.push("load-indicator__step--off");
      else if (i <= 10) classes.push("load-indicator__step--ghost-light");
      else classes.push("load-indicator__step--ghost-heavy");
    }
  }
  return classes;
}
