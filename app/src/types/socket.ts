export type TSocketUpdateRequest = {
  x: number;
  y: number;
  attacking: number;
  health: number;
};

export type TSocketTypingRequest = {
  message: string;
};

export type TSocketRequest<T> = T & {
  socketId: string;
};
