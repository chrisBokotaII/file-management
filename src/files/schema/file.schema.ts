import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type FileDocument = HydratedDocument<File>;

@Schema()
export class File {
  @Prop({ index: true })
  name: string;

  @Prop({ default: 'application/octet-stream' })
  mimeType: string;

  @Prop({ default: 0 })
  size: number;

  @Prop({ required: false })
  path?: string; // Optional path for external storage

  @Prop({ type: Buffer, required: false })
  data?: Buffer; // Optional raw data for in-database storage

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', index: true })
  user: User;

  @Prop({ default: () => new Date() })
  uploadedAt: Date; // Automatically set the upload date
}

export const FileSchema = SchemaFactory.createForClass(File);

// // Add virtual field for URL (optional)
// FileSchema.virtual('url').get(function () {
//   return this.path ? `https://your-storage-service.com/files/${this.path}` : null;
// });

// // Example of a custom method
// FileSchema.methods.getSummary = function () {
//   return `File: ${this.name} (${this.mimeType}), Size: ${this.size} bytes`;
// };

// export const FileSchema = SchemaFactory.createForClass(File);
