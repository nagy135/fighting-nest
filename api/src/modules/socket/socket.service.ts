import { TSocketUpdateRequest } from '@ctypes/socket';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SocketService {
  echo(): string {
    return 'Socket';
  }
  broadcast(eventName: string, socket: Socket, data: TSocketUpdateRequest) {
    socket.broadcast.emit(eventName, {
      ...data,
      socketId: socket.id,
    });
  }
}
