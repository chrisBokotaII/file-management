import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FilesService } from 'src/files/files.service';

@Processor('largeFile')
export class LargeFileConsumer extends WorkerHost {
  constructor(private readonly fileService: FilesService) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    

    await this.fileService.createLarge(job.data.path, job.data.userId);

    return {};
  }
  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    console.log('job completed');
  }
}
