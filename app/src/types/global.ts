export type TPosition = {
  x: number;
  y: number;
};

export type TPlayer = {
  id: string;
  x: number;
  y: number;
  health: number;
  attacking: number;
  message: string | null;
};

export type TActions = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};
