import { MiddlewareConsumer, Module } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QueuesController } from './queues.controller';
import { BullModule } from '@nestjs/bullmq';
import { FilesModule } from 'src/files/files.module';
import { LargeFileConsumer } from './consumers';
import { FileMiddleware } from './file.middleware';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'largeFile',
    }),
    FilesModule,
  ],
  controllers: [QueuesController],
  providers: [QueuesService,LargeFileConsumer],
})
export class QueuesModule {
  configure(consumer:MiddlewareConsumer){
    consumer.apply(FileMiddleware).forRoutes('queues');
  }
}
