import { TSocketRequest, TSocketResponse } from '@ctypes/socket';
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';

@WebSocketGateway(3333, { cors: true })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection {
  private connectedClients: number = 0;

  @WebSocketServer()
  private server: Server;

  constructor(private readonly socketService: SocketService) {}

  handleConnection(_client: any, ..._args: any[]): void {
    this.connectedClients += 1;
    Logger.log(`Client connected: ${this.connectedClients}#`);
  }
  private readonly logger = new Logger(SocketGateway.name);
  afterInit(_server: any) {
    this.logger.log('Websocket Gateway initialized');
  }

  /**
   *  this event's purpose is to return same data as well
   *  as emit it to pong event for everyone else
   *
   * @author Viktor Nagy <viktor.nagy@01people.com>
   */
  @SubscribeMessage('ping')
  handlePing(
    @MessageBody() data: any,
    @ConnectedSocket() _socket: Socket,
  ): TSocketResponse {
    Logger.log('received ping event', data);
    const response: TSocketResponse = {
      status: 'ok',
      data,
    };
    this.server.emit('pong', response);
    return response;
  }

  @SubscribeMessage('update')
  handleUpdate(
    @MessageBody() data: TSocketRequest,
    @ConnectedSocket() socket: Socket,
  ): any {
    this.logger.log('received update event', data);
    return this.socketService.broadcast('update', socket, data);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: TSocketRequest,
    @ConnectedSocket() socket: Socket,
  ): any {
    this.logger.log('received typing event', data);
    return this.socketService.broadcast('typing', socket, data);
  }
}
