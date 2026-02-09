import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesModule } from '../files/files.module';
import { GeocodeService } from '../geocode/geocode.service';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [EventsController],
  providers: [EventsService, GeocodeService],
  exports: [EventsService],
})
export class EventsModule {}
