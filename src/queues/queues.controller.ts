import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateFileDto } from 'src/files/dto/create-file.dto';

@Controller('queues')
export class QueuesController {
  constructor(@InjectQueue('largeFile') private fileQueue: Queue) {}
  @UseGuards(AuthGuard)
  @Post('create')
  async create(@Body() createFileDto: CreateFileDto, @Request() req) {
    
    const job = await this.fileQueue.add(
      'largeFile',
      {
        path: createFileDto.path,
        userId: req.user.sub,
      },
      {
        attempts: 2,
        removeOnFail: true,
        removeOnComplete: true,
      },
    );
    return {
      message: 'file processing',
      job
    };
  }
}
