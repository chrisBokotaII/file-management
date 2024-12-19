import { Injectable, InternalServerErrorException, NotFoundException, StreamableFile } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { File } from './schema/file.schema';
import mongoose, { Connection, Model } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Response } from 'express';

@Injectable()
export class FilesService {
  private gridFSBucket: GridFSBucket;

  constructor(
    @InjectModel(File.name) private fileModel: Model<File>,
    private userService: UsersService,
    @InjectConnection() private readonly connection: Connection,
  ) {
    // Initialize GridFSBucket
    this.gridFSBucket = new GridFSBucket(this.connection.db, {
      bucketName: 'files',
    });
  }
  async createLarge(pathName:string, userId: string){
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get file stats
    const mimeType =
      mime.lookup(pathName) || 'application/octet-stream';
      // File is large: store in GridFS
      const readStream = fs.createReadStream(pathName);
      const uploadStream = this.gridFSBucket.openUploadStream(
        path.basename(pathName),
        {
          metadata: { userId: user._id, mimeType },
        },
      );

      readStream.pipe(uploadStream);

      return new Promise((resolve, reject) => {
        uploadStream.on('finish', (file) => {
          resolve({
            message: 'File stored in GridFS',
            id:uploadStream.id
          });
        });

        uploadStream.on('error', (error) => reject(error));
      });
    
  }

  async createsmall(pathName:string, userId: string) {
    try {
      // Check if file exists
      if (!fs.existsSync(pathName)) {
        throw new NotFoundException('File not found');
      }

      // Find the user
      const user = await this.userService.findOne(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get file stats
      const stats = fs.statSync(pathName);
      const mimeType =
        mime.lookup(pathName) || 'application/octet-stream';

    
        // File is small: store in MongoDB
        const buffer = fs.readFileSync(pathName);

        const file = new this.fileModel({
          name: path.basename(pathName),
          mimeType,
          size: stats.size,
          path: pathName,
          user: user._id,
          data: buffer, // Store file data directly
        });

        return await file.save();
      
    } catch (error) {
      console.error('Error while creating file:', error.message);
      throw error;
    }
  }

  async downloadFile(fileId: string, res: Response) {
    try {
      // Validate ObjectId
      if (!ObjectId.isValid(fileId)) throw new NotFoundException('Invalid file ID');
  
      // Check if the file exists in MongoDB
      const file = await this.fileModel.findById(fileId);
      if (file) {
        const fileName = `file${path.extname(file.path)}`;
  
        res.set({
          'Content-Type': file.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        res.send(file.data);

        // return new StreamableFile(file.data).setErrorHandler(
        //   err =>{
        //     err&&console.log(err)
        //   }
        // );
      }
  
      // Check in GridFS
      const fileStream = this.gridFSBucket.openDownloadStream(new ObjectId(fileId));
      fileStream.on('error', () => {
        throw new NotFoundException('File not found');
      });
  
      const gridFSFile = await this.gridFSBucket.find({ _id: new ObjectId(fileId) }).toArray();
      if (!gridFSFile.length) throw new NotFoundException('File not found');
  
      const originalFileName = gridFSFile[0].filename;
      const mimeType = gridFSFile[0].metadata?.mimeType || 'application/octet-stream';
      const fileName = `${path.basename(originalFileName)}${path.extname(originalFileName)}`;
  
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      });
  
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error while downloading file:', error);
    }
  }
  

  async readFile(fileId: string): Promise<Buffer> {
    try {
      // Check if file is in MongoDB
      const file = await this.fileModel.findById(fileId);
      if (file) {
        return file.data; // Return file buffer
      }

      // File might be in GridFS
      const chunks: Buffer[] = [];
      const fileStream = this.gridFSBucket.openDownloadStream(
        new ObjectId(fileId),
      );

      return new Promise((resolve, reject) => {
        fileStream
          .on('data', (chunk) => chunks.push(chunk))
          .on('end', () => resolve(Buffer.concat(chunks)))
          .on('error', (error) => reject(error));
      });
    } catch (error) {
      console.error('Error while reading file:', error.message);
      throw new NotFoundException('File not found');
    }
  }

  async convertFile(filepath: string, format: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const outputFilePath = path.join(
        path.dirname(filepath),
        `${path.basename(filepath, path.extname(filepath))}.${format}`,
      );

      const readStream = fs.createReadStream(filepath);
      const writeStream = fs.createWriteStream(outputFilePath);

      // Pipe data
      readStream.pipe(writeStream);

      // Handle events
      writeStream.on('finish', async () => {
        try {
          const buffer = fs.readFileSync(outputFilePath);
          resolve(buffer);
        } catch (error) {
          reject(new Error(`Failed to read converted file: ${error.message}`));
        }
      });

      readStream.on('error', (error) =>
        reject(new Error(`Read error: ${error.message}`)),
      );
      writeStream.on('error', (error) =>
        reject(new Error(`Write error: ${error.message}`)),
      );
    });
  }
}
