import { animate, stagger, utils } from "animejs";

// Position change animation for timing tower rows
export function animatePositionChange(
  element: HTMLElement,
  fromPosition: number,
  toPosition: number
) {
  const direction = toPosition < fromPosition ? -1 : 1;
  const distance = Math.abs(toPosition - fromPosition);

  // Flash color based on gaining/losing positions
  const flashColor = direction < 0 ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)";

  animate(element, {
    backgroundColor: [flashColor, "transparent"],
    duration: 800,
    easing: "easeOutQuad",
  });

  // Scale pulse for significant position changes
  if (distance >= 2) {
    animate(element, {
      scale: [1, 1.02, 1],
      duration: 400,
      easing: "easeOutElastic(1, 0.5)",
    });
  }
}

// Overtake highlight animation
export function animateOvertake(element: HTMLElement) {
  animate(element, {
    backgroundColor: ["rgba(168, 85, 247, 0.4)", "transparent"],
    borderLeftColor: ["#a855f7", "transparent"],
    borderLeftWidth: ["4px", "0px"],
    duration: 1200,
    easing: "easeOutExpo",
  });
}

// Telemetry value change animation
export function animateTelemetryValue(
  element: HTMLElement,
  fromValue: number,
  toValue: number
) {
  animate(element, {
    innerHTML: [fromValue, toValue],
    duration: 300,
    easing: "linear",
    round: 1,
  });
}

// Progress bar animation (throttle, brake)
export function animateProgressBar(element: HTMLElement, toValue: number) {
  animate(element, {
    width: `${toValue}%`,
    duration: 150,
    easing: "easeOutQuad",
  });
}

// Lap time highlight animation (personal best, overall best)
export function animateLapTime(
  element: HTMLElement,
  type: "personal" | "overall" | "normal"
) {
  const colors = {
    personal: "#22c55e", // green
    overall: "#a855f7", // purple
    normal: "transparent",
  };

  animate(element, {
    backgroundColor: [colors[type] + "40", "transparent"],
    scale: type !== "normal" ? [1, 1.05, 1] : [1],
    duration: type !== "normal" ? 600 : 0,
    easing: "easeOutQuad",
  });
}

// Pit stop animation
export function animatePitStop(element: HTMLElement) {
  animate(element, {
    backgroundColor: ["rgba(234, 179, 8, 0.3)", "transparent"],
    duration: 2000,
    easing: "easeOutQuad",
  });
}

// Track position dot animation
export function animateTrackPosition(
  element: SVGElement,
  toX: number,
  toY: number,
  duration: number = 500
) {
  animate(element, {
    cx: toX,
    cy: toY,
    duration,
    easing: "easeOutQuad",
  });
}

// Number counter animation
export function animateCounter(
  element: HTMLElement,
  from: number,
  to: number,
  duration: number = 500
) {
  const obj = { value: from };
  animate(obj, {
    value: to,
    duration,
    easing: "easeOutQuad",
    update: () => {
      element.textContent = Math.round(obj.value).toString();
    },
  });
}

// Stagger animation for list items
export function animateListStagger(elements: HTMLElement[]) {
  animate(elements, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 400,
    delay: stagger(50),
    easing: "easeOutQuad",
  });
}

// Fade in animation
export function animateFadeIn(element: HTMLElement, duration: number = 300) {
  animate(element, {
    opacity: [0, 1],
    duration,
    easing: "easeOutQuad",
  });
}

// Pulse animation for alerts
export function animatePulse(element: HTMLElement) {
  animate(element, {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
    duration: 600,
    easing: "easeInOutQuad",
    loop: 3,
  });
}

// Race control message animation
export function animateRaceControlMessage(element: HTMLElement) {
  animate(element, {
    opacity: [0, 1],
    translateX: [-20, 0],
    duration: 400,
    easing: "easeOutQuad",
  });
}

// Tab slide animation - slide out old content, slide in new content
export function animateTabSlideOut(
  element: HTMLElement,
  direction: "left" | "right",
  onComplete?: () => void
) {
  const translateX = direction === "left" ? -30 : 30;
  const options: Parameters<typeof animate>[1] = {
    opacity: [1, 0],
    translateX: [0, translateX],
    duration: 200,
    easing: "easeInQuad",
  };
  if (onComplete) {
    options.complete = onComplete;
  }
  animate(element, options);
}

export function animateTabSlideIn(
  element: HTMLElement,
  direction: "left" | "right"
) {
  const translateX = direction === "left" ? 30 : -30;
  animate(element, {
    opacity: [0, 1],
    translateX: [translateX, 0],
    duration: 250,
    easing: "easeOutQuad",
  });
}

// Countdown digit flip animation
export function animateCountdownDigit(element: HTMLElement, newValue: string) {
  animate(element, {
    translateY: [0, -10],
    opacity: [1, 0],
    duration: 150,
    easing: "easeInQuad",
    onComplete: () => {
      element.textContent = newValue;
      animate(element, {
        translateY: [10, 0],
        opacity: [0, 1],
        duration: 150,
        easing: "easeOutQuad",
      });
    },
  });
}

// Progress bar fill animation with glow effect
export function animateProgressBarFill(
  element: HTMLElement,
  toValue: number,
  color: string
) {
  animate(element, {
    width: `${toValue}%`,
    boxShadow: [`0 0 10px ${color}`, `0 0 5px ${color}`],
    duration: 1000,
    easing: "easeOutExpo",
  });
}

// Position change indicator animation (up/down arrow)
export function animatePositionIndicator(
  element: HTMLElement,
  direction: "up" | "down" | "same"
) {
  if (direction === "same") return;

  const color = direction === "up" ? "#22c55e" : "#ef4444";
  const translateY = direction === "up" ? [5, 0] : [-5, 0];

  animate(element, {
    translateY,
    opacity: [0, 1],
    color: [color, color],
    duration: 400,
    easing: "easeOutBack",
  });
}

// Points change animation with bounce
export function animatePointsChange(
  element: HTMLElement,
  gained: boolean
) {
  const color = gained ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)";

  animate(element, {
    backgroundColor: [color, "transparent"],
    scale: [1, 1.1, 1],
    duration: 600,
    easing: "easeOutElastic(1, 0.5)",
  });
}

// Daytime icon animation (sun rise/set, moon)
export function animateDaytimeIcon(element: HTMLElement, type: "sunrise" | "day" | "sunset" | "night") {
  const animations: Record<string, object> = {
    sunrise: {
      translateY: [10, 0],
      opacity: [0, 1],
      rotate: ["-20deg", "0deg"],
    },
    day: {
      scale: [0.8, 1],
      opacity: [0.5, 1],
      rotate: ["0deg", "360deg"],
    },
    sunset: {
      translateY: [0, 5],
      opacity: [1, 0.7],
      rotate: ["0deg", "20deg"],
    },
    night: {
      scale: [0.5, 1],
      opacity: [0, 1],
      rotate: ["-180deg", "0deg"],
    },
  };

  animate(element, {
    ...animations[type],
    duration: 800,
    easing: "easeOutQuad",
  });
}

// Stagger animation for standings list
export function animateStandingsStagger(elements: HTMLElement[]) {
  animate(elements, {
    opacity: [0, 1],
    translateX: [-20, 0],
    duration: 300,
    delay: stagger(30, { start: 0 }),
    easing: "easeOutQuad",
  });
}

// Shimmer loading animation
export function animateShimmer(element: HTMLElement) {
  return animate(element, {
    backgroundPosition: ["200% 0", "-200% 0"],
    duration: 1500,
    easing: "linear",
    loop: true,
  });
}
