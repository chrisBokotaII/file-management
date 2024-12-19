import { Injectable, NotFoundException } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import * as fs from 'fs'

@Injectable()
export class FileMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        console.log('Request...');
        const {path}=req.body
        if (!fs.existsSync(path)) {
                throw new NotFoundException('File not found');
              }
        next();
    }
}