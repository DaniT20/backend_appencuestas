import {
    Controller, Post, Body, BadRequestException, UseGuards,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface UploadMediaBody {
    base64: string;
    filename: string;
    mimeType: string;
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(private readonly uploadSvc: UploadService) {}

    @Post('media')
    async uploadMedia(@Body() body: UploadMediaBody): Promise<{ url: string; key: string }> {
        if (!body?.base64) throw new BadRequestException('No se recibió ningún archivo.');
        if (!body.mimeType?.startsWith('image/')) throw new BadRequestException('Solo se permiten imágenes.');

        const base64Data = body.base64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        if (!buffer.length) throw new BadRequestException('El archivo está vacío.');
        if (buffer.length > 10 * 1024 * 1024) throw new BadRequestException('El archivo supera el límite de 10 MB.');

        return this.uploadSvc.uploadFile(buffer, body.filename || 'photo.jpg', body.mimeType);
    }
}
