"use client";

import { useEffect, useRef } from "react";

export function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = ctx;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    g.scale(2, 2);
    g.strokeStyle = "#6a0938";
    g.lineWidth = 2;
    g.lineCap = "round";

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function down(e: PointerEvent) {
      drawing.current = true;
      const p = pos(e);
      g.beginPath();
      g.moveTo(p.x, p.y);
      canvas!.setPointerCapture(e.pointerId);
    }
    function move(e: PointerEvent) {
      if (!drawing.current) return;
      const p = pos(e);
      g.lineTo(p.x, p.y);
      g.stroke();
    }
    function up() {
      drawing.current = false;
      onChangeRef.current(canvas!.toDataURL("image/png"));
    }
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, []);

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChangeRef.current("");
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="h-52 w-full touch-none rounded-lg border border-[#d9c9a3] bg-white sm:h-40"
      />
      <button type="button" onClick={clear} className="mt-1 text-sm text-[#6a0938] underline">
        Borrar firma
      </button>
    </div>
  );
}
