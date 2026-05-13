import { useEffect, useRef, useState } from "react";
import DesktopVersion2 from "../../imports/DesktopVersion2";

interface DesktopReservationPageProps {
  onNavigateBack: () => void;
}

const DESIGN_WIDTH = 1600;
const DESIGN_HEIGHT = 1052;

export default function DesktopReservationPage({ onNavigateBack }: DesktopReservationPageProps) {
  const [scale, setScale] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (!parentRef.current) return;
      const { width, height } = parentRef.current.getBoundingClientRect();
      setScale(Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT, 1));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div ref={parentRef} className="w-screen min-h-screen overflow-auto bg-gray-100 flex items-start justify-center py-8">
      <div
        className="relative overflow-hidden rounded-[30px] shadow-xl bg-[#f1e6d2]"
        style={{ width: `${DESIGN_WIDTH * scale}px`, height: `${DESIGN_HEIGHT * scale}px` }}
      >
        <div className="absolute inset-0" style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <div className="relative w-[1600px] h-[1052px]">
            <DesktopVersion2 />
            {/* Clickable return panel for reservation -> ordering */}
            <button
              type="button"
              onClick={onNavigateBack}
              aria-label="Go back to online ordering"
              title="Go back to online ordering"
              className="absolute left-[641px] top-[47px] z-20 cursor-pointer rounded-[20px] bg-transparent"
              style={{ width: 899, height: 245 }}
            />
            {/* Back button - clicking sidebar home icon */}
            <div
              className="absolute left-[34px] top-[399px] w-[45px] h-[45px] cursor-pointer z-10"
              onClick={onNavigateBack}
              title="Back to ordering"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
