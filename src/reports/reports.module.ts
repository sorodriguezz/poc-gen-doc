import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ExportLimiterService } from './export-limiter.service';
import { User } from '../user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [ReportsController],
  providers: [ReportsService, ExportLimiterService],
})
export class ReportsModule {}
