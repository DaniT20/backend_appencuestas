import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FormsModule } from './forms/forms.module';
import { ResponsesModule } from './responses/responses.module';
import { BiModule } from './bi/bi.module';
import { TrackingModule } from './tracking/tracking.module';
import { PublicDataModule } from './public-data/public-data.module';
import { ParishesModule } from './parishes/parishes.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.nest', // o como lo tengas
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGO_URI');
        if (!uri) {
          throw new Error('❌ MONGO_URI no está definido');
        }
        return { uri };
      },
    }),
    AuthModule,
    UsersModule,
    FormsModule,
    ResponsesModule,
    BiModule,
    TrackingModule,
    PublicDataModule,
    ParishesModule,
    UploadModule,
  ],
  controllers: [AppController],   // 👈 IMPORTANTE
  providers: [AppService],        // 👈 IMPORTANTE
})
export class AppModule {}
