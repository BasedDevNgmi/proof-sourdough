"use client";

interface DoughyProps {
  happiness?: number;
  mood?: "happy" | "sleepy" | "hungry";
  size?: number;
}

export function Doughy({ happiness = 72, mood = "happy", size = 100 }: DoughyProps) {
  const eyeY = 60;
  const mouthY = 74;

  function renderEyes() {
    switch (mood) {
      case "happy":
        return (
          <>
            <g>
              <ellipse cx={40} cy={eyeY} rx={3} ry={3.5} fill="#3d2b1f">
                <animate attributeName="ry" values="3.5;0.5;3.5" dur="3s" begin="2s" repeatCount="indefinite" />
              </ellipse>
              <circle cx={41} cy={eyeY - 1} r={1} fill="#fff" opacity={0.7} />
            </g>
            <g>
              <ellipse cx={60} cy={eyeY} rx={3} ry={3.5} fill="#3d2b1f">
                <animate attributeName="ry" values="3.5;0.5;3.5" dur="3s" begin="2s" repeatCount="indefinite" />
              </ellipse>
              <circle cx={61} cy={eyeY - 1} r={1} fill="#fff" opacity={0.7} />
            </g>
          </>
        );
      case "sleepy":
        return (
          <>
            <path d={`M 36 ${eyeY} Q 40 ${eyeY + 3} 44 ${eyeY}`} stroke="#3d2b1f" strokeWidth={2} strokeLinecap="round" fill="none" />
            <path d={`M 56 ${eyeY} Q 60 ${eyeY + 3} 64 ${eyeY}`} stroke="#3d2b1f" strokeWidth={2} strokeLinecap="round" fill="none" />
          </>
        );
      case "hungry":
        return (
          <>
            <g>
              <circle cx={40} cy={eyeY} r={3.5} fill="none" stroke="#3d2b1f" strokeWidth={1.5} />
              <path d={`M 40 ${eyeY - 3.5} A 3.5 3.5 0 0 1 40 ${eyeY + 3.5}`} fill="none" stroke="#3d2b1f" strokeWidth={1.5}>
                <animateTransform attributeName="transform" type="rotate" from={`0 40 ${eyeY}`} to={`360 40 ${eyeY}`} dur="2s" repeatCount="indefinite" />
              </path>
            </g>
            <g>
              <circle cx={60} cy={eyeY} r={3.5} fill="none" stroke="#3d2b1f" strokeWidth={1.5} />
              <path d={`M 60 ${eyeY - 3.5} A 3.5 3.5 0 0 1 60 ${eyeY + 3.5}`} fill="none" stroke="#3d2b1f" strokeWidth={1.5}>
                <animateTransform attributeName="transform" type="rotate" from={`0 60 ${eyeY}`} to={`360 60 ${eyeY}`} dur="2s" repeatCount="indefinite" />
              </path>
            </g>
          </>
        );
    }
  }

  function renderMouth() {
    switch (mood) {
      case "happy":
        return (
          <path
            d={`M 43 ${mouthY} Q 50 ${mouthY + 6} 57 ${mouthY}`}
            stroke="#3d2b1f"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        );
      case "hungry":
        return (
          <ellipse cx={50} cy={mouthY + 2} rx={4} ry={5} fill="#3d2b1f" />
        );
      case "sleepy":
        return (
          <line x1={44} y1={mouthY + 2} x2={56} y2={mouthY + 2} stroke="#3d2b1f" strokeWidth={2} strokeLinecap="round" />
        );
    }
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="doughBody" cx="0.5" cy="0.4" r="0.55">
          <stop offset="0%" stopColor="#fdf3dc" />
          <stop offset="60%" stopColor="#efd9a8" />
          <stop offset="100%" stopColor="#cdb281" />
        </radialGradient>
      </defs>

      <g opacity={0.6}>
        <circle cx={30} cy={32} r={2} fill="#cdb281">
          <animate attributeName="cy" values="32;20;10" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.6;0" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx={55} cy={30} r={1.5} fill="#cdb281">
          <animate attributeName="cy" values="30;18;8" dur="3.5s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.5;0" dur="3.5s" begin="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx={70} cy={34} r={1.8} fill="#cdb281">
          <animate attributeName="cy" values="34;22;12" dur="4s" begin="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.5;0" dur="4s" begin="1.5s" repeatCount="indefinite" />
        </circle>
      </g>

      <g style={{ transformOrigin: "50px 65px" }}>
        <path
          d="M 18 65 Q 18 38 50 38 Q 82 38 82 65 Q 82 82 68 88 Q 60 91 50 91 Q 40 91 32 88 Q 18 82 18 65 Z"
          fill="url(#doughBody)"
          stroke="#cdb281"
          strokeWidth={1.2}
        >
          <animate
            attributeName="d"
            values="M 18 65 Q 18 38 50 38 Q 82 38 82 65 Q 82 82 68 88 Q 60 91 50 91 Q 40 91 32 88 Q 18 82 18 65 Z;M 16 66 Q 16 40 50 39 Q 84 40 84 66 Q 84 82 68 87 Q 60 90 50 90 Q 40 90 32 87 Q 16 82 16 66 Z;M 18 65 Q 18 38 50 38 Q 82 38 82 65 Q 82 82 68 88 Q 60 91 50 91 Q 40 91 32 88 Q 18 82 18 65 Z"
            dur="4s"
            repeatCount="indefinite"
          />
        </path>

        {renderEyes()}

        {renderMouth()}

        <ellipse cx={30} cy={68} rx={5} ry={3} fill="#e8a0a0" opacity={0.35} />
        <ellipse cx={70} cy={68} rx={5} ry={3} fill="#e8a0a0" opacity={0.35} />
      </g>

      {mood === "sleepy" && (
        <text x={72} y={42} fontSize={12} fill="#3d2b1f" fontStyle="italic">
          z
          <animate attributeName="opacity" values="0;0.7;0" dur="2s" repeatCount="indefinite" />
          <animate attributeName="y" values="42;34;28" dur="2s" repeatCount="indefinite" />
        </text>
      )}
    </svg>
  );
}
