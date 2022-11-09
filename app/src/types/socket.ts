export type TSocketMoveRequest = {
  x: number;
  y: number;
};
export type TSocketAttackRequest = {};

export type TSocketRequest<T> = T & {
  socketId: string;
};
