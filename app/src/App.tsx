import { TActions, TPlayer } from "@ctypes/global";
import {
  TSocketRequest,
  TSocketTypingRequest,
  TSocketUpdateRequest,
} from "@ctypes/socket";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { loadSvg } from "utils";

const CANVAS_HEIGHT = 800;
const CANVAS_WIDTH = 800;
const EXPLOSION_HEIGHT = 300;
const EXPLOSION_WIDTH = EXPLOSION_HEIGHT;
const PLAYER_RADIUS = 10;
const HEALTH_BAR_OFFSET_Y = -PLAYER_RADIUS - 10;
const HEALTH_BAR_OFFSET_X = -PLAYER_RADIUS;
const HEALTH_BAR_WIDTH = 5;
const DEFAULT_HEALTH = 100;
const ATTACKING_FRAMES = 20;
const ATTACK_LINE_WIDTH = 2;
const HEALTH_DECREMENT_VALUE = 5;
const STEP = 10;
const TYPING_TIMEOUT = 2 * 1000;
const ATTACKING_WAIT_MS = 30;

export default () => {
  const typingRemovalHandle = useRef<NodeJS.Timeout | null>(null);
  const typingModeRef = useRef(false);
  const typingValueRef = useRef("");
  const pressingRef = useRef<TActions>({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const playersRef = useRef<Record<string, TPlayer>>({});

  const socketRef = useRef<Socket | null>(null);
  const explosionImgsRef = useRef<HTMLImageElement[]>([]);
  const attackingTimeRef = useRef<number | null>(null);

  useEffect(() => {
    loadSvg().then((e) => (explosionImgsRef.current = e));

    if (socketRef.current) return;

    socketRef.current = io(process.env.REACT_APP_WS_EP!, {
      transports: ["websocket"],
    });

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
            message: null,
          };
        } else {
          player.x = x;
          player.y = y;
          player.health = health;
          player.attacking = attacking;
        }
      }
    );

    socketRef.current.on(
      "typing",
      (data: TSocketRequest<TSocketTypingRequest>) => {
        if (!playersRef.current) return;
        const players = playersRef.current;
        const { message, socketId } = data;

        const player = players[socketId];
        if (!player) return;

        player.message = message;
      }
    );
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePressRelease = (action: "press" | "release", key: string) => {
    if (!pressingRef.current) return;

    if (typingModeRef.current && socketRef.current) {
      if (action === "release") return;
      if (key === "Enter") {
        syncTyping(socketRef.current, typingValueRef.current);
        if (typingRemovalHandle.current)
          clearTimeout(typingRemovalHandle.current);

        typingRemovalHandle.current = setTimeout(() => {
          syncTyping(socketRef.current!, null);
        }, TYPING_TIMEOUT);
        typingValueRef.current = "";
        typingModeRef.current = false;
      } else if (key === "Backspace") {
        typingValueRef.current = typingValueRef.current.slice(0, -1);
      } else if (key.length === 1) {
        typingValueRef.current += key;
      }
    } else {
      if (key === "`" && action === "press") {
        typingModeRef.current = true;
        return;
      }
      switch (key) {
        case "w":
          pressingRef.current.up = action === "press" ? true : false;
          break;
        case "s":
          pressingRef.current.down = action === "press" ? true : false;
          break;
        case "a":
          pressingRef.current.left = action === "press" ? true : false;
          break;
        case "d":
          pressingRef.current.right = action === "press" ? true : false;
          break;
        case " ":
          if (action !== "press" || !socketRef.current) return;
          const me = playersRef.current[socketRef.current.id];
          me.attacking = ATTACKING_FRAMES;
          syncUpdate(socketRef.current, me);
          break;
        default:
          return;
      }
    }
  };

  const playerMove = () => {
    if (!socketRef.current || !pressingRef.current) return;
    const me = playersRef.current[socketRef.current.id];
    if (!me) return;
    if (pressingRef.current.up) me.y -= STEP;
    if (pressingRef.current.down) me.y += STEP;
    if (pressingRef.current.left) me.x -= STEP;
    if (pressingRef.current.right) me.x += STEP;

    if (me.x < 0) me.x = CANVAS_WIDTH;
    if (me.x > CANVAS_WIDTH) me.x = 0;
    if (me.y < 0) me.y = CANVAS_HEIGHT;
    if (me.y > CANVAS_HEIGHT) me.y = 0;

    if (socketRef.current && Object.values(pressingRef.current).some((e) => e))
      syncUpdate(socketRef.current, me);
  };

  const tick = () => {
    if (!canvasRef.current || !socketRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    const now = new Date().getTime();

    playerMove();
    ctx.clearRect(0, 0, width, height);

    const me = playersRef.current[socketRef.current.id];
    for (const player of Object.values(playersRef.current)) {
      ctx.beginPath();
      if (player.id === socketRef.current.id) ctx.fillStyle = "orange";
      ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "black";

      ctx.fillStyle = redLevel(player.health);
      ctx.fillRect(
        player.x + HEALTH_BAR_OFFSET_X - PLAYER_RADIUS,
        player.y + HEALTH_BAR_OFFSET_Y,
        PLAYER_RADIUS * 4 * (player.health / DEFAULT_HEALTH),
        HEALTH_BAR_WIDTH
      );
      ctx.fillStyle = "black";

      if (player.attacking) {
        const { x: attackerX, y: attackerY } = player;
        const radius = EXPLOSION_HEIGHT / 2;
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
        if (explosionImgsRef.current.length) {
          ctx.drawImage(
            explosionImgsRef.current[ATTACKING_FRAMES - player.attacking],
            player.x - EXPLOSION_WIDTH / 2,
            player.y - EXPLOSION_HEIGHT / 2,
            EXPLOSION_WIDTH,
            EXPLOSION_HEIGHT
          );
        } else {
          // LEGACY FALLBACK
          ctx.beginPath();
          ctx.lineWidth = ATTACK_LINE_WIDTH;
          ctx.arc(player.x, player.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      if (player.message) {
        ctx.font = "20px monospace";
        ctx.fillText(
          player.message,
          player.x - 2 * PLAYER_RADIUS,
          player.y - 3 * PLAYER_RADIUS
        );
      }

      if (typingModeRef.current) {
        ctx.font = "30px serif";
        ctx.fillText(typingValueRef.current, 20, 30);
      }
    }
    if (me && me.attacking) {
      if (attackingTimeRef.current === null) {
        me.attacking -= 1;
        attackingTimeRef.current = now;
        syncUpdate(socketRef.current, me);
      } else {
        if (now - attackingTimeRef.current >= ATTACKING_WAIT_MS) {
          me.attacking -= 1;
          attackingTimeRef.current = now;
          syncUpdate(socketRef.current, me);
        }
      }
    } else {
      attackingTimeRef.current = null;
    }
    window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    window.addEventListener("keydown", (e) =>
      handlePressRelease("press", e.key)
    );
    window.addEventListener("keyup", (e) =>
      handlePressRelease("release", e.key)
    );
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
            message: null,
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

const redLevel = (currentHealth: number): string => {
  return `#${Math.floor(
    256 * ((DEFAULT_HEALTH - currentHealth) / DEFAULT_HEALTH)
  ).toString(16)}0000`;
};

const syncTyping = (socket: Socket, text: string | null) => {
  socket.emit("typing", { message: text }, (response: any) =>
    console.log(response)
  );
};

const syncUpdate = (socket: Socket, data: TSocketUpdateRequest) => {
  socket.emit("update", data, (response: any) => console.log(response));
};
