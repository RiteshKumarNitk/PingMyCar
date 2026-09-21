import { ImageResponse } from "next/og";

export const alt = "PingMyCar — Contact a vehicle owner privately";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Decorative (non-scannable) QR block for the share image. */
function qrMatrix(n: number): boolean[][] {
  const cells: boolean[][] = [];
  for (let r = 0; r < n; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < n; c++) {
      const inFinder =
        (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
      let on: boolean;
      if (inFinder) {
        const fr = r < 7 ? r : r - (n - 7);
        const fc = c < 7 ? c : c - (n - 7);
        const ring = Math.max(Math.abs(fr - 3), Math.abs(fc - 3));
        on = ring !== 2;
      } else if (r === 6 || c === 6) {
        on = (r + c) % 2 === 0;
      } else {
        on = ((r * 7 + c * 5 + ((r * c) % 4)) % 3) % 2 === 0;
      }
      row.push(on);
    }
    cells.push(row);
  }
  return cells;
}

export default function OgImage() {
  const n = 13;
  const cells = qrMatrix(n);
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#16222c",
          color: "white",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 90,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 660 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 13,
                background: "#2f7fb8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              P
            </div>
            <div style={{ fontSize: 40, fontWeight: 700 }}>PingMyCar</div>
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.15,
              marginTop: 44,
            }}
          >
            Contact a vehicle owner — without anyone&apos;s phone number.
          </div>
          <div style={{ fontSize: 30, color: "#9fb3c8", marginTop: 26 }}>
            A private QR sticker for your vehicle.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "white",
            borderRadius: 28,
            padding: 26,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {cells.map((row, r) => (
              <div key={r} style={{ display: "flex" }}>
                {row.map((on, c) => (
                  <div
                    key={c}
                    style={{
                      width: 15,
                      height: 15,
                      background: on ? "#16222c" : "white",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 19,
              color: "#334155",
              marginTop: 14,
              fontWeight: 600,
            }}
          >
            Scan to send a message
          </div>
        </div>
      </div>
    ),
    size
  );
}
