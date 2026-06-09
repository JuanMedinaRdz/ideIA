import { ImageResponse } from "next/og";

/**
 * Icono PWA 192x192. Generado al vuelo con next/og (sin diseñador, sin
 * Photoshop). Se sirve desde /icon-192.png — el manifest lo referencia.
 *
 * Diseño minimal: fondo dark + sparkle morado centrado. Coherente con
 * el theme de la app. Si quieres customizar, edita JSX abajo.
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
          background:
            "radial-gradient(circle at 30% 20%, #2d1856 0%, #0a0a0e 70%)",
        }}
      >
        <Sparkle size={120} />
      </div>
    ),
    { width: 192, height: 192 },
  );
}

function Sparkle({ size }: { size: number }) {
  // Sparkle simple en SVG inline. Color primary de nuestra app (#a78bfa).
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#a78bfa"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}
