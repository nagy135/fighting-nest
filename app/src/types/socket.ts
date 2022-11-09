export type TSocketMoveRequest = {
  x: number;
  y: number;
};
export type TSocketAttackRequest = undefined;

export type TSocketRequest<T> = T & {
  socketId: string;
};
