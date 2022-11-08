import { TSocketAttackRequest, TSocketMoveRequest } from '@ctypes/socket';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  echo(): string {
    return 'Socket';
  }
  move(server: Server, socketId: string, data: TSocketMoveRequest) {
    server.emit('move', {
      ...data,
      socketId,
    });
  }

  attack(server: Server, socketId: string, _data: TSocketAttackRequest) {
    server.emit('attack', {
      socketId,
    });
  }
}
