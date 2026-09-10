import { Module } from '@nestjs/common';
import { AppointmentStatusesController } from './appointment-statuses.controller.js';
import { AppointmentStatusesService } from './appointment-statuses.service.js';

@Module({
  controllers: [AppointmentStatusesController],
  providers: [AppointmentStatusesService],
})
export class AppointmentStatusesModule {}
