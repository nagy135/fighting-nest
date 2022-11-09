export type TSocketUpdateRequest = {
  x: number;
  y: number;
  attacking: number;
  health: number;
};

export type TSocketRequest = TSocketUpdateRequest;

export type TSocketResponse = {
  status: 'ok' | 'nok',
  data: any
};
