import { Controller, Get } from '@nestjs/common';

import { Message } from '@collaborative-whiteboard/api-interfaces';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getData(): Message {
    return this.appService.getData();
  }
}
