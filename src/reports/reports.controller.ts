import {
  Controller,
  Get,
  Res,
  Logger,
  BadRequestException,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { ReportsService } from './reports.service';
import { ExportLimiterService } from './export-limiter.service';

@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly reportsService: ReportsService,
    private readonly limiter: ExportLimiterService,
  ) {}

  @Sse('users/xlsx/progress')
  exportUsersProgress(): Observable<MessageEvent> {
    return this.reportsService.getUsersExportProgress();
  }

  @Get('users/xlsx/stream-progress')
  async exportUsersExcelWithProgress(@Res() res: Response) {
    if (!this.limiter.acquire()) {
      throw new BadRequestException(
        'Hay demasiadas exportaciones en ejecución, inténtalo más tarde.',
      );
    }

    // Configurar headers para streaming de texto
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      await this.reportsService.writeUsersExcelWithProgress(res);
    } catch (err) {
      this.logger.error('Error generating XLSX with progress', err);
      if (!res.headersSent) {
        res.status(500).send('Error generating XLSX with progress');
      }
    } finally {
      this.limiter.release();
      if (!res.headersSent) {
        res.end();
      }
    }
  }

  @Get('users/xlsx')
  async exportUsersExcel(@Res() res: Response) {
    if (!this.limiter.acquire()) {
      throw new BadRequestException(
        'Hay demasiadas exportaciones en ejecución, inténtalo más tarde.',
      );
    }

    const memBefore = process.memoryUsage().heapUsed;
    const cpuBefore = process.cpuUsage();

    this.logger.log(
      `Export XLSX start | heapUsed=${(memBefore / 1024 / 1024).toFixed(
        2,
      )} MB | activeExports=${this.limiter.getActive()}`,
    );

    // Headers del Excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="users_export.xlsx"',
    );

    try {
      // Pasamos el Response como stream de salida
      await this.reportsService.writeUsersExcelToStream(res);

      const memAfter = process.memoryUsage().heapUsed;
      const cpuDiff = process.cpuUsage(cpuBefore);
      const deltaMb = (memAfter - memBefore) / 1024 / 1024;

      this.logger.log(
        `Export XLSX end | heapUsed=${(memAfter / 1024 / 1024).toFixed(
          2,
        )} MB | deltaHeap=${deltaMb.toFixed(2)} MB | cpuUser=${(
          cpuDiff.user / 1000
        ).toFixed(2)}ms | cpuSys=${(cpuDiff.system / 1000).toFixed(
          2,
        )}ms | activeExports=${this.limiter.getActive()}`,
      );
    } catch (err) {
      this.logger.error('Error generating XLSX', err);
      if (!res.headersSent) {
        res.status(500).send('Error generating XLSX');
      } else {
        res.end();
      }
    } finally {
      this.limiter.release();
    }
  }
}
