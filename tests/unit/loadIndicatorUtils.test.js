import { calculateStepClasses } from "../../src/utils/loadIndicator.js";

describe("calculateStepClasses", () => {
  test("load 0", () => {
    const result = calculateStepClasses(0);
    expect(result).toEqual([
      "load-indicator--step--ghost-normal",
      "load-indicator--step--ghost-normal",
      "load-indicator--step--ghost-normal",
      "load-indicator--step--ghost-normal",
      "load-indicator--step--ghost-normal",
      "load-indicator--step--ghost-light",
      "load-indicator--step--ghost-light",
      "load-indicator--step--ghost-light",
      "load-indicator--step--ghost-light",
      "load-indicator--step--ghost-light",
      "load-indicator--step--ghost-heavy",
      "load-indicator--step--ghost-heavy",
      "load-indicator--step--ghost-heavy",
      "load-indicator--step--ghost-heavy",
      "load-indicator--step--ghost-heavy",
    ]);
  });

  test("load 5", () => {
    const result = calculateStepClasses(5);
    expect(result.slice(0, 5)).toEqual([
      "load-indicator--step--on-normal",
      "load-indicator--step--on-normal",
      "load-indicator--step--on-normal",
      "load-indicator--step--on-normal",
      "load-indicator--step--on-normal",
    ]);
    expect(result[5]).toBe("load-indicator--step--ghost-light");
    expect(result[10]).toBe("load-indicator--step--ghost-heavy");
  });

  test("load 6", () => {
    const result = calculateStepClasses(6);
    expect(result[5]).toBe("load-indicator--step--on-light");
  });

  test("load 10", () => {
    const result = calculateStepClasses(10);
    expect(
      result.slice(5, 10).every((c) => c === "load-indicator--step--on-light"),
    ).toBe(true);
  });

  test("load 11", () => {
    const result = calculateStepClasses(11);
    expect(result[10]).toBe("load-indicator--step--on-heavy");
    expect(result[11]).toBe("load-indicator--step--ghost-heavy");
  });
});
