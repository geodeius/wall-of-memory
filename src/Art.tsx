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
        <g transform="translate(-520 -190) rotate(-15)">{flower("#d87b91")}</g>
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
            strokeWidth="5"
          />
          <path
            d="M390-160l16-47 17 41 48 2-36 30 12 43-39-24-39 25 11-46-35-25z"
            stroke="#bf8e2e"
            strokeWidth="4"
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
          <path d="M-660 15q65-55 115-17" stroke="#d6a0b6" strokeWidth="26" />
          <path
            d="M-50 330q8-18 16 0t16 0 16 0"
            stroke="#b692b8"
            strokeWidth="4"
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
            fill="#866296"
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
          <rect width="140" height="67" fill="#e7d998" />
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
          <text x="13" y="49" fontSize="11" fontFamily="DM Sans" fill="#515344">
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
      </svg>
    </div>
  );
});
