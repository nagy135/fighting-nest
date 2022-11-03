import { useCallback, useEffect, useRef, useState } from "react";

const PLAYER_RADIUS = 10;
const STEP = 10;

type TPosition = {
  x: number;
  y: number;
};

export default () => {
  const positionRef = useRef<TPosition>({ x: 100, y: 100 });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const playerMove = (key: string) => {
    switch (key) {
      case "w":
        positionRef.current = {
          x: positionRef.current.x,
          y: positionRef.current.y - STEP,
        };
        break;
      case "s":
        positionRef.current = {
          x: positionRef.current.x,
          y: positionRef.current.y + STEP,
        };
        break;
      case "a":
        positionRef.current = {
          x: positionRef.current.x - STEP,
          y: positionRef.current.y,
        };
        break;
      case "d":
        positionRef.current = {
          x: positionRef.current.x + STEP,
          y: positionRef.current.y,
        };
        break;
    }
    console.log(key);
  };

  const tick = () => {
    if (!canvasRef.current || !positionRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { x, y, width, height } = canvasRef.current.getBoundingClientRect();

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.arc(
      positionRef.current.x,
      positionRef.current.y,
      PLAYER_RADIUS,
      0,
      2 * Math.PI
    );
    ctx.fill();
    window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    window.addEventListener("keydown", (e) => playerMove(e.key));
    window.requestAnimationFrame(tick);
  }, []);
  return <canvas id="canvas" ref={canvasRef} width={300} height={300}></canvas>;
};
