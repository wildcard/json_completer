import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { JsonCompleterService } from './json-completer.service';

@Controller('api')
export class AppController {
  constructor(private readonly jsonCompleterService: JsonCompleterService) {}

  @Post('complete')
  async complete(@Body() body: { partialJson: string }) {
    try {
      if (!body.partialJson && body.partialJson !== '') {
        throw new HttpException('Missing partialJson field', HttpStatus.BAD_REQUEST);
      }

      const result = await this.jsonCompleterService.complete(body.partialJson);

      return {
        success: true,
        result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('complete-incremental')
  async completeIncremental(@Body() body: { partialJson: string }) {
    try {
      if (!body.partialJson && body.partialJson !== '') {
        throw new HttpException('Missing partialJson field', HttpStatus.BAD_REQUEST);
      }

      const result = await this.jsonCompleterService.completeIncremental(body.partialJson);

      return {
        success: true,
        result,
        state: this.jsonCompleterService.getState(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reset')
  reset() {
    this.jsonCompleterService.reset();
    return {
      success: true,
      message: 'State reset successfully',
    };
  }
}
