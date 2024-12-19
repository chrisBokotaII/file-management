import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  Request
} from '@nestjs/common';
import { FilesService } from './files.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateFileDto } from './dto/create-file.dto';
import { Response } from 'express';


@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('download/:id')
   async findAll(@Param('id') id: string,  @Res({passthrough:true}) res:Response) {
    return this.filesService.downloadFile(id,  res);
  }
   @UseGuards(AuthGuard)
    @Post('createsmall')
    async create(@Body() createFileDto: CreateFileDto, @Request() req) {
      
      
      return  this.filesService.createsmall(createFileDto.path, req.user.sub);
    }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.readFile(id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
  //   return this.filesService.update(+id, updateFileDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.filesService.remove(+id);
  // }
}
