import { Controller, Get } from '@nestjs/common';
import { SocketService } from './socket.service';

@Controller('socket')
export class SocketController {
  constructor(private readonly appService: SocketService) {}

  @Get()
  echo(): string {
    return this.appService.echo();
  }
}
