import { Module } from '@nestjs/common';
import { PlantillaController } from './plantilla.controller.js';
import { PlantillaService } from './plantilla.service.js';

@Module({
  controllers: [PlantillaController],
  providers: [PlantillaService],
})
export class PlantillaModule {}
