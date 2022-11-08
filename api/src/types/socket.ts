export type TEventTypes = TSocketRequest['type'];

// request data {{{
export type TSocketMoveRequest = {
  x: number;
  y: number;
};
export type TSocketAttackRequest = undefined;
// }}}

export type TSocketRequest = {
  type: 'move',
  data: TSocketMoveRequest
} | {
  type: 'attack',
  data: TSocketAttackRequest
};

export type TSocketResponse = {
  status: 'ok' | 'nok',
  data: any
};
