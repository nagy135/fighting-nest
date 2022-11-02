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

@WebSocketGateway(3333, { cors: true })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection {
  private connectedClients: number = 0;

  @WebSocketServer()
  private server: Server;


  handleConnection(client: any, ...args: any[]) {
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
  handleEvent(
    @MessageBody() data: any,
    @ConnectedSocket() socket: Socket,
  ): Record<string, any> {
    Logger.log('received ping event', data);
    const response = {
      status: 'ok',
      data,
    };
    this.server.emit('pong', response);
    return response;
  }
}
