import { TPlayer, TPosition } from "@ctypes/global";
import { TSocketMoveRequest, TSocketRequest } from "@ctypes/socket";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const PLAYER_RADIUS = 10;
const HEALTH_BAR_OFFSET_Y = -PLAYER_RADIUS - 10;
const HEALTH_BAR_OFFSET_X = -PLAYER_RADIUS;
const HEALTH_BAR_WIDTH = 5;
const DEFAULT_HEALTH = 100;
const ATTACKING_FRAMES = 15;
const ATTACK_LINE_WIDTH = 2;
const STEP = 10;

export default () => {
  console.log("render");
  const positionRef = useRef<TPosition>({ x: 100, y: 100 });
  const attackingRef = useRef<number>(0);

  const playersRef = useRef<TPlayer[]>([]);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (socketRef.current) return;

    socketRef.current = io("ws://127.0.0.1:13333");
    socketRef.current.on("move", (data: TSocketRequest<TSocketMoveRequest>) => {
      if (!playersRef.current) return;
      const players = playersRef.current;
      const { x, y, socketId } = data;

      const playerIndex = players.findIndex((e) => e.id === socketId);
      if (playerIndex === -1) {
        players.push({
          id: socketId,
          x,
          y,
          attacking: false,
          health: 100
        });
      } else {
        players[playerIndex].x = x;
        players[playerIndex].y = y;
      }
    });
  }, []);

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
      case " ":
        attackingRef.current = ATTACKING_FRAMES;
        break;
      default:
        return;
    }
    console.log(
      "================\n",
      "after: ",
      positionRef.current,
      "\n================"
    );

    if (socketRef.current) syncMove(socketRef.current, positionRef.current)
  };

  const tick = () => {
    if (!canvasRef.current || !positionRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { x, y, width, height } = canvasRef.current.getBoundingClientRect();

    ctx.clearRect(0, 0, width, height);

    for (const player of playersRef.current) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillRect(
        positionRef.current.x + HEALTH_BAR_OFFSET_X,
        positionRef.current.y + HEALTH_BAR_OFFSET_Y,
        PLAYER_RADIUS * 2,
        HEALTH_BAR_WIDTH
      );

      // if (attackingRef.current) {
      //   ctx.beginPath();
      //   ctx.lineWidth = ATTACK_LINE_WIDTH;
      //   ctx.arc(
      //     positionRef.current.x,
      //     positionRef.current.y,
      //     PLAYER_RADIUS * 2 * (ATTACKING_FRAMES - attackingRef.current),
      //     0,
      //     2 * Math.PI
      //   );
      //   attackingRef.current -= 1;
      //   ctx.stroke();
      // }
    }
    window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    window.addEventListener("keydown", (e) => playerMove(e.key));
    window.requestAnimationFrame(tick);
    setInterval(() => {
      if (socketRef.current) syncMove(socketRef.current, positionRef.current)
    }, 1000)
  }, []);
  return (
    <canvas
      id="canvas"
      style={{ border: "2px solid black", margin: "1em" }}
      ref={canvasRef}
      width={800}
      height={800}
    />
  );
};

const syncMove = (socket: Socket, position: TPosition) => {
  socket.emit(
    "update",
    {
      type: "move",
      data: position
    },
    (response: any) => console.log(response)
  );
};
