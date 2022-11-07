import { TSocketAttackRequest, TSocketMoveRequest } from '@ctypes/socket';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketService {
  echo(): string {
    return 'Socket';
  }
  move(data: TSocketMoveRequest) {
    return 'Socket';
  }

  attack(data: TSocketAttackRequest) {
    return 'Socket';
  }
}
