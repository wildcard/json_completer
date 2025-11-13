import { Module } from '@nestjs/common';
import { JsonCompleterService } from './json-completer.service';
import { AppController } from './app.controller';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [JsonCompleterService],
  exports: [JsonCompleterService],
})
export class AppModule {}
