import { ImageResponse } from "next/og";

export const alt = "Mazikor Schools — Smart School Management, Made Simple.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
          padding: "72px 84px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                display: "flex",
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "#1d4ed8",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              M
            </div>
            <div style={{ display: "flex", color: "white", fontSize: 32, fontWeight: 600, letterSpacing: -1 }}>
              Mazikor Schools
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "flex", width: 88, height: 8, borderRadius: 4, background: "#1d4ed8" }} />
            <div
              style={{
                display: "flex",
                color: "white",
                fontSize: 64,
                fontWeight: 700,
                letterSpacing: -2,
                lineHeight: 1.08,
              }}
            >
              Smart School Management,
              <br />
              Made Simple.
            </div>
            <div style={{ display: "flex", color: "#9ca3af", fontSize: 28, maxWidth: 900, lineHeight: 1.4 }}>
              Students · Attendance · Academics · Fees — one powerful platform for your school.
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
