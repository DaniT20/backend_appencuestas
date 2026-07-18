import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class UploadService implements OnModuleInit {
    private bucket: ReturnType<typeof getStorage>['bucket'] extends (...args: any[]) => infer R ? R : never;

    onModuleInit() {
        if (!admin.apps.length) {
            const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
            const serviceAccount = require(keyPath);

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
            });
        }

        this.bucket = getStorage().bucket();
    }

    async uploadFile(
        buffer: Buffer,
        originalName: string,
        mimeType: string,
        folder = 'media-responses',
    ): Promise<{ url: string; key: string }> {
        const ext  = path.extname(originalName) || '.jpg';
        const key  = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
        const file = this.bucket.file(key);

        await file.save(buffer, {
            metadata: { contentType: mimeType },
            public: true,
        });

        const url = `https://storage.googleapis.com/${this.bucket.name}/${key}`;
        return { url, key };
    }

    async deleteFile(key: string): Promise<void> {
        try {
            await this.bucket.file(key).delete();
        } catch {
            // ignorar si ya no existe
        }
    }
}
