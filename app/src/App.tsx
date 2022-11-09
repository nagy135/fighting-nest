import { TPlayer, TPosition } from "@ctypes/global";
import {
  TSocketAttackRequest,
  TSocketMoveRequest,
  TSocketRequest,
} from "@ctypes/socket";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const CANVAS_HEIGHT = 800;
const CANVAS_WIDTH = 800;
const PLAYER_RADIUS = 10;
const HEALTH_BAR_OFFSET_Y = -PLAYER_RADIUS - 10;
const HEALTH_BAR_OFFSET_X = -PLAYER_RADIUS;
const HEALTH_BAR_WIDTH = 5;
const DEFAULT_HEALTH = 100;
const ATTACKING_FRAMES = 15;
const ATTACK_LINE_WIDTH = 2;
const HEALTH_DECREMENT_VALUE = 5;
const STEP = 10;

export default () => {
  console.log("render");
  const positionRef = useRef<TPosition>({ x: 100, y: 100 });

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
          attacking: 0,
          health: DEFAULT_HEALTH,
        });
      } else {
        players[playerIndex].x = x;
        players[playerIndex].y = y;
      }
    });

    socketRef.current.on(
      "attack",
      (data: TSocketRequest<TSocketAttackRequest>) => {
        if (!playersRef.current) return;
        const players = playersRef.current;
        const { socketId } = data;

        const playerIndex = players.findIndex((e) => e.id === socketId);
        if (playerIndex === -1) {
          return;
        } else {
          players[playerIndex].attacking = ATTACKING_FRAMES;
        }
      }
    );
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
        if (socketRef.current) syncAttack(socketRef.current);
        return;
      default:
        return;
    }

    if (socketRef.current) syncMove(socketRef.current, positionRef.current);
  };

  const tick = () => {
    if (!canvasRef.current || !positionRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvasRef.current.getBoundingClientRect();

    ctx.clearRect(0, 0, width, height);

    for (const player of playersRef.current) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillRect(
        player.x + HEALTH_BAR_OFFSET_X,
        player.y + HEALTH_BAR_OFFSET_Y,
        PLAYER_RADIUS * 2 * (player.health / DEFAULT_HEALTH),
        HEALTH_BAR_WIDTH
      );

      if (player.attacking) {
        const { x: attackerX, y: attackerY } = player;
        const radius =
          PLAYER_RADIUS * 2 * (ATTACKING_FRAMES - player.attacking);
        playersRef.current
          .filter(
            (e) =>
              e.id !== player.id &&
              attackerX > e.x - radius &&
              attackerX < e.x + radius &&
              attackerY > e.y - radius &&
              attackerY < e.y + radius
          )
          .forEach((e) => {
            e.health -= HEALTH_DECREMENT_VALUE;
            if (e.health <= 0 && e.id === socketRef.current?.id) {
              e.health = DEFAULT_HEALTH;
              e.x = Math.random() * CANVAS_WIDTH;
              e.y = Math.random() * CANVAS_HEIGHT;
              if (socketRef.current)
              syncMove(socketRef.current, {x: e.x, y: e.y});
            } else if (e.health <= 0) e.health = DEFAULT_HEALTH;
          });
        ctx.beginPath();
        ctx.lineWidth = ATTACK_LINE_WIDTH;
        ctx.arc(player.x, player.y, radius, 0, 2 * Math.PI);
        player.attacking -= 1;
        ctx.stroke();
      }
    }
    window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    window.addEventListener("keydown", (e) => playerMove(e.key));
    window.requestAnimationFrame(tick);
    setInterval(() => {
      if (socketRef.current) syncMove(socketRef.current, positionRef.current);
    }, 1000);
  }, []);
  return (
    <canvas
      id="canvas"
      style={{ border: "2px solid black", margin: "1em" }}
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
    />
  );
};

const syncMove = (socket: Socket, position: TPosition) => {
  socket.emit(
    "update",
    {
      type: "move",
      data: position,
    },
    (response: any) => console.log(response)
  );
};

const syncAttack = (socket: Socket) => {
  socket.emit(
    "update",
    {
      type: "attack",
    },
    (response: any) => console.log(response)
  );
};
