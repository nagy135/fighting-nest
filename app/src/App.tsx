import { useEffect, useRef, useState } from "react";

const PLAYER_RADIUS = 10;

type TPosition = {
  x: number;
  y: number;
}

export default () => {

  const [position, setPosition] = useState<TPosition>({x: 100, y: 100});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const handle = setInterval(() => {
    if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      const { x, y, width, height } = canvasRef.current.getBoundingClientRect();

      ctx.clearRect(0, 0, width, height);

      ctx.beginPath();
      ctx.arc(position.x, position.y, PLAYER_RADIUS, 0, 2*Math.PI);
      ctx.fill();

    }, 1000);

    return () => clearInterval(handle);
  }, []);
  return (
    <canvas id="canvas" ref={canvasRef} width={300} height={300}>
    </canvas>
  );
}
