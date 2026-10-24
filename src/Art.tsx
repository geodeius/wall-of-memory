import { memo } from "react";
const flower = (color: string) => (
  <g>
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <ellipse
        key={a}
        cx="0"
        cy="-33"
        rx="20"
        ry="34"
        transform={`rotate(${a})`}
        fill={color}
      />
    ))}
    <circle r="22" fill="#e5b947" />
  </g>
);
// Fixed paint flecks stay attached to the artwork while the camera moves.
const spray = Array.from({ length: 38 }, (_, i) => {
  const angle = i * 2.39996;
  const radius = 15 + Math.sqrt(i / 38) * 74;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * 0.55,
    r: i % 9 === 0 ? 3.5 : 0.7 + (i % 4) * 0.45,
  };
});
export const Art = memo(function Art() {
  return (
    <div className="curated" aria-label="Curated wall artwork">
      <img
        className="mural"
        src="/assets/leave-your-mark.webp"
        alt="Leave your mark"
        draggable="false"
      />
      <div className="mural-caption">
        A little space for everyone. A little mark that's yours.
      </div>
      <svg className="art" viewBox="-720 -440 1440 880" aria-hidden="true">
        <defs>
          <mask
            id="wall-paint-swipe"
            style={{ maskType: "alpha" }}
            maskUnits="objectBoundingBox"
            maskContentUnits="objectBoundingBox"
          >
            <image href="/assets/ink-swipe.svg" width="1" height="1" />
          </mask>
          <mask
            id="wall-plaster-ink"
            maskUnits="userSpaceOnUse"
            x="-720"
            y="-440"
            width="1440"
            height="880"
          >
            <image
              href="/assets/painted-stucco.webp"
              x="-720"
              y="-440"
              width="1440"
              height="880"
              preserveAspectRatio="xMidYMid slice"
            />
          </mask>
        </defs>
        <g className="wall-paint-layers" aria-hidden="true">
          <g fill="#66023c" transform="translate(-355 306) rotate(-7)">
            <rect width="320" height="20" mask="url(#wall-paint-swipe)" />
            <path
              d="M26 12v25m8-25v14m240-14v41"
              stroke="#66023c"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>
          <g transform="translate(365 -37) rotate(8)">
            <rect
              width="220"
              height="112"
              fill="#ebc451"
              opacity=".35"
              mask="url(#wall-paint-swipe)"
            />
          </g>
          <g transform="translate(-405 -319) rotate(-9)">
            <rect
              width="345"
              height="63"
              fill="#427c61"
              opacity=".1"
              mask="url(#wall-paint-swipe)"
            />
          </g>
          {[
            [-520, -155, "#bd4867"],
            [495, 250, "#386fa5"],
            [-308, 315, "#66023c"],
            [405, -120, "#b77a22"],
          ].map(([x, y, color], cluster) => (
            <g
              key={cluster}
              transform={`translate(${x} ${y}) rotate(${cluster * 37})`}
              fill={String(color)}
            >
              {spray.map((dot, i) => (
                <circle
                  key={i}
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.r}
                  opacity={0.25 + (i % 5) * 0.13}
                />
              ))}
            </g>
          ))}
        </g>
        <g className="wall-painted-art" mask="url(#wall-plaster-ink)">
          <g transform="translate(-520 -190) rotate(-15)">
            {flower("#d87b91")}
          </g>
          <g transform="translate(500 220) rotate(14) scale(.8)">
            {flower("#7daeb4")}
          </g>
          <g transform="translate(575 -290)">
            <circle r="48" fill="#ebc451" />
            <path
              d="M-20 4q20 28 40 0"
              fill="none"
              stroke="#465452"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="-15" cy="-10" r="3" fill="#465452" />
            <circle cx="15" cy="-10" r="3" fill="#465452" />
          </g>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M-450 190q-90-74-49-101 30-14 49 20 22-43 53-20 37 32-53 101z"
              stroke="#bb556c"
              strokeWidth="9"
            />
            <path
              d="M390-160l16-47 17 41 48 2-36 30 12 43-39-24-39 25 11-46-35-25z"
              stroke="#bf8e2e"
              strokeWidth="7"
            />
            <path
              d="M-180-277q13-23 26 0t26 0 26 0 26 0"
              stroke="#62989d"
              strokeWidth="6"
            />
            <path
              d="M110 278q70-55 130-5t120-10m-22-13 25 12-21 19"
              stroke="#649274"
              strokeWidth="6"
            />
            <path d="M-660 15q65-55 115-17" stroke="#bd4867" strokeWidth="34" />
            <path
              d="M-50 330q8-18 16 0t16 0 16 0"
              stroke="#66023c"
              strokeWidth="7"
            />
          </g>
          <g fontFamily="Caveat" fontWeight="700">
            <text
              transform="translate(-370 -270) rotate(-9)"
              fontSize="35"
              fill="#4c7e69"
            >
              Good things grow here.
            </text>
            <text
              transform="translate(380 12) rotate(8)"
              fontSize="35"
              fill="#427e96"
            >
              less scroll.
            </text>
            <text
              transform="translate(410 50) rotate(8)"
              fontSize="35"
              fill="#427e96"
            >
              more soul.
            </text>
            <text
              transform="translate(-330 280) rotate(-8)"
              fontSize="33"
              fill="#66023c"
            >
              Make room for wonder.
            </text>
            <text
              transform="translate(60 -300) rotate(5)"
              fontSize="25"
              fill="#ad6655"
            >
              a work in togetherness
            </text>
          </g>
          <g transform="translate(-620 270) rotate(-12)">
            <rect
              width="140"
              height="67"
              fill="#e7d998"
              mask="url(#wall-paint-swipe)"
            />
            <text
              x="13"
              y="29"
              fontFamily="DM Sans"
              fontSize="15"
              fontWeight="700"
              fill="#515344"
            >
              HUMAN MADE
            </text>
            <text
              x="13"
              y="49"
              fontSize="11"
              fontFamily="DM Sans"
              fill="#515344"
            >
              perfectly imperfect
            </text>
          </g>
          <g transform="translate(630 340) rotate(12)">
            <circle r="44" fill="#b95f47" />
            <circle r="37" fill="none" stroke="#f2e7ce" />
            <text
              textAnchor="middle"
              y="-4"
              fill="#fff0d3"
              fontFamily="DM Sans"
              fontSize="12"
            >
              BE HERE
            </text>
            <text
              textAnchor="middle"
              y="14"
              fill="#fff0d3"
              fontFamily="DM Sans"
              fontSize="12"
            >
              BE KIND
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
});
