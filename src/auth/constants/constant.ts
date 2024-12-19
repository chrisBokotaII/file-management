import { error } from 'console';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) throw new error('JWT_secret is not defined');
export const jwtConstants = {
  secret: process.env.JWT_SECRET,
};
