import React from "react";
import { cn } from "../../utils/cn";

const TOAST_JOURNEY_EASING = "linear";

/**
 * Premium side-profile sedan — shared by login logo and toast badge.
 */
const CarSilhouette = ({
  body,
  glass,
  glassDark,
  wheelOuter,
  wheelInner,
  accent,
  brandStyle,
  frontWheelStyle,
  rearWheelStyle,
}) => (
  <>
    {brandStyle && (
      <ellipse cx="20" cy="27.8" rx="14.5" ry="1.6" fill="#022c22" opacity="0.22" />
    )}

    {/* Lower body / chassis */}
    <path
      d="M3 25.2C3 23.4 4.5 22 6.8 21.4L11 20.2C13 19.6 15.5 19.2 18 19L24.5 18.6C28 18.4 31.5 19.2 34 20.6C35.8 21.6 37 23 37 24.6C37 25.8 36 26.6 34.5 26.8H5.5C4 26.8 3 26.2 3 25.2Z"
      fill={body}
    />

    {/* Cabin & hood */}
    <path
      d="M11 20.2L14.2 15.4C15.6 13.6 17.8 12.8 20.5 12.6C23.2 12.4 25.8 13.2 27.8 14.8L31.5 19.4L28.5 18.8L24.5 18.6L18 19L11 20.2Z"
      fill={body}
    />

    {/* Windshield */}
    <path
      d="M14.2 15.4L17.8 13.6L22.5 13L27 14.6L31.5 19.4L27.8 18.2L22 17.6L16.5 18.2L14.2 15.4Z"
      fill={glass}
      opacity={brandStyle ? 0.88 : 0.7}
    />

    {/* Rear window */}
    <path d="M11 20.2L12.8 17.4L14.2 15.4" fill={glassDark} opacity={0.55} />

    {/* Side glass */}
    <path
      d="M17.8 13.6L22.5 13L27 14.6L26.2 18.4L17.2 19.2L16.5 18.2L17.8 13.6Z"
      fill={glass}
      opacity={0.35}
    />

    {/* Belt line */}
    <path
      d="M7.5 22.8H34.5"
      stroke={accent}
      strokeWidth="0.55"
      strokeLinecap="round"
      opacity={brandStyle ? 0.32 : 0.25}
    />

    {/* Headlight */}
    <path
      d="M34.8 22.2C35.8 22.4 36.6 23 36.8 23.8"
      stroke={glass}
      strokeWidth="0.7"
      strokeLinecap="round"
      opacity={0.75}
      fill="none"
    />
    <circle cx="35.6" cy="22.6" r="1" fill={glass} opacity={0.95} />

    {/* Taillight */}
    <rect
      x="4.2"
      y="22"
      width="2.4"
      height="2.2"
      rx="0.7"
      fill={wheelInner}
      opacity={brandStyle ? 0.85 : 0.65}
    />

    {/* Front wheel */}
    <g style={frontWheelStyle ?? { transformBox: "fill-box", transformOrigin: "center" }}>
      <circle cx="11" cy="26.4" r="4.2" fill={wheelOuter} />
      <circle cx="11" cy="26.4" r="3.1" fill="#0f3d2e" opacity={brandStyle ? 0.35 : 0.2} />
      <circle cx="11" cy="26.4" r="2.4" fill={wheelInner} />
      <circle cx="11" cy="26.4" r="1" fill={body} opacity={0.9} />
    </g>

    {/* Rear wheel */}
    <g style={rearWheelStyle ?? { transformBox: "fill-box", transformOrigin: "center" }}>
      <circle cx="29" cy="26.4" r="4.2" fill={wheelOuter} />
      <circle cx="29" cy="26.4" r="3.1" fill="#0f3d2e" opacity={brandStyle ? 0.35 : 0.2} />
      <circle cx="29" cy="26.4" r="2.4" fill={wheelInner} />
      <circle cx="29" cy="26.4" r="1" fill={body} opacity={0.9} />
    </g>
  </>
);

/**
 * Fleetly brand mark — login logo (loop) and toast delivery (one-shot sweep).
 */
const FleetlyCarMark = ({
  size = 40,
  carOnly = false,
  animate = "loop",
  brandStyle = false,
  driveDurationMs = 4500,
  className,
}) => {
  const fLoop = "animate-[f-lifecycle_6s_ease-in-out_infinite]";
  const fToast = "animate-[toast-f-lifecycle_1.15s_ease-in-out_forwards]";

  const carLoop = "animate-[car-lifecycle_6s_ease-in-out_infinite]";
  const carToastFull = "animate-[toast-car-lifecycle_1.15s_ease-in-out_forwards]";

  const isToastDrive = animate === "toast" && carOnly;

  const toastDriveStyle = isToastDrive
    ? {
        animation: `toast-car-journey ${driveDurationMs}ms ${TOAST_JOURNEY_EASING} forwards`,
      }
    : undefined;

  const toastWheelStyle = isToastDrive
    ? {
        animation: `toast-wheel-journey ${driveDurationMs}ms ${TOAST_JOURNEY_EASING} forwards`,
        transformBox: "fill-box",
        transformOrigin: "center",
      }
    : undefined;

  const fAnimation =
    animate === "toast" ? fToast : animate === "loop" ? fLoop : "";

  const carAnimation =
    animate === "toast"
      ? carOnly
        ? undefined
        : carToastFull
      : animate === "loop"
        ? carLoop
        : "";

  const body = brandStyle ? "#ffffff" : "currentColor";
  const glass = brandStyle ? "#ecfdf5" : "currentColor";
  const glassDark = brandStyle ? "#d1fae5" : "currentColor";
  const wheelOuter = brandStyle ? "#064e3b" : "currentColor";
  const wheelInner = brandStyle ? "#34d399" : "currentColor";
  const accent = brandStyle ? "#10b981" : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("relative z-10", className)}
      aria-hidden="true"
    >
      {!carOnly && (
        <>
          <rect
            x="5"
            y="8"
            width="6"
            height="32"
            rx="3"
            fill={body}
            className={cn(fAnimation, animate === "toast" && "[animation-delay:0.05s]")}
          />
          <rect
            x="5"
            y="8"
            width="28"
            height="6"
            rx="3"
            fill={body}
            className={cn(fAnimation, animate === "toast" && "[animation-delay:0.12s]")}
          />
          <rect
            x="5"
            y="20"
            width="20"
            height="6"
            rx="3"
            fill={body}
            className={cn(fAnimation, animate === "toast" && "[animation-delay:0.18s]")}
          />
        </>
      )}

      <g className={carAnimation} style={toastDriveStyle}>
        <CarSilhouette
          body={body}
          glass={glass}
          glassDark={glassDark}
          wheelOuter={wheelOuter}
          wheelInner={wheelInner}
          accent={accent}
          brandStyle={brandStyle}
          frontWheelStyle={toastWheelStyle}
          rearWheelStyle={toastWheelStyle}
        />
      </g>
    </svg>
  );
};

export default FleetlyCarMark;
