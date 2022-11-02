import { Logger } from '@nestjs/common';
import {
    ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway(3333, { cors: true })
export class SocketGateway implements OnGatewayInit {
  private readonly logger = new Logger(SocketGateway.name);
  afterInit(_server: any) {
    this.logger.log('Websocket Gateway initialized');
  }

  @SubscribeMessage('ping')
  handleEvent(
    @MessageBody() data: any,
    @ConnectedSocket() socket: Socket
  ): Record<string, any> {
    Logger.log('received ping event', data);
    const response = {
      status: 'ok',
      data,
    };
    socket.emit('pong', response);
    return response;
  }
}
