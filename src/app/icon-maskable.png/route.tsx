import { ImageResponse } from "next/og";

/**
 * Icon "maskable" — Android puede recortarlo en cualquier forma (círculo,
 * squircle, etc.). El sparkle se mantiene en la "safe zone" central (80%)
 * para que nunca se recorte aunque el OS lo enmascare agresivamente.
 *
 * Sin un maskable icon, Android añade bordes blancos feos al recortar.
 */

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0e",
        }}
      >
        {/* Sparkle más pequeño (220 vs 320) para respetar safe zone 80% */}
        <svg
          width={220}
          height={220}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#a78bfa"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
          <path d="M4 17v2" />
          <path d="M5 18H3" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
