import { TSocketUpdateRequest } from '@ctypes/socket';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SocketService {
  echo(): string {
    return 'Socket';
  }
  update(socket: Socket, data: TSocketUpdateRequest) {
    socket.broadcast.emit('update', {
      ...data,
      socketId: socket.id,
    });
  }
}
