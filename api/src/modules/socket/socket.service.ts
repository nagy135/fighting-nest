import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketService {
  echo(): string {
    return 'Socket';
  }
}
