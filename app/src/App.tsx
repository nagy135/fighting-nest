import { TPlayer } from "@ctypes/global";
import { TSocketRequest, TSocketUpdateRequest } from "@ctypes/socket";
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
  const playersRef = useRef<Record<string, TPlayer>>({});

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (socketRef.current) return;

    socketRef.current = io("ws://127.0.0.1:13333");

    socketRef.current.on(
      "update",
      (data: TSocketRequest<TSocketUpdateRequest>) => {
        if (!playersRef.current) return;
        const players = playersRef.current;
        const { x, y, attacking, health, socketId } = data;

        const player = players[socketId];
        if (!player) {
          console.log("new player");
          players[socketId] = {
            id: socketId,
            x,
            y,
            attacking: 0,
            health: DEFAULT_HEALTH,
          };
        } else {
          player.x = x;
          player.y = y;
          player.health = health;
          player.attacking = attacking;
        }
      }
    );
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const playerMove = (key: string) => {
    if (!socketRef.current) return;
    const me = playersRef.current[socketRef.current.id];
    switch (key) {
      case "w":
        me.y -= STEP;
        break;
      case "s":
        me.y += STEP;
        break;
      case "a":
        me.x -= STEP;
        break;
      case "d":
        me.x += STEP;
        break;
      case " ":
        me.attacking = ATTACKING_FRAMES;
        break;
      default:
        return;
    }

    if (socketRef.current) syncUpdate(socketRef.current, me);
  };

  const tick = () => {
    if (!canvasRef.current || !socketRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvasRef.current.getBoundingClientRect();

    ctx.clearRect(0, 0, width, height);

    const me = playersRef.current[socketRef.current.id];
    for (const player of Object.values(playersRef.current)) {
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
        if (
          me.id !== player.id &&
          me.x > attackerX - radius &&
          me.x < attackerX + radius &&
          me.y > attackerY - radius &&
          me.y < attackerY + radius
        ) {
          me.health -= HEALTH_DECREMENT_VALUE;
          if (me.health <= 0) {
            me.health = DEFAULT_HEALTH;
            me.x = Math.floor(Math.random() * CANVAS_WIDTH);
            me.y = Math.floor(Math.random() * CANVAS_HEIGHT);
          }
          syncUpdate(socketRef.current, me);
        }
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
      if (socketRef.current !== null && playersRef.current) {
        const me = playersRef.current[socketRef.current.id];
        if (!me) {
          const newMe = {
            id: socketRef.current.id,
            x: Math.floor(Math.random() * CANVAS_WIDTH),
            y: Math.floor(Math.random() * CANVAS_HEIGHT),
            attacking: 0,
            health: DEFAULT_HEALTH,
          };
          playersRef.current[socketRef.current.id] = newMe;
          syncUpdate(socketRef.current, newMe);
        } else {
          syncUpdate(socketRef.current, me);
        }
      }
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

const syncUpdate = (socket: Socket, data: TSocketUpdateRequest) => {
  socket.emit("update", data, (response: any) => console.log(response));
};
