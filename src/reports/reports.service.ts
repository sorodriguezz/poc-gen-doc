import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import * as ExcelJS from 'exceljs';
import { Observable, Subject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly progressSubject = new Subject<MessageEvent>();

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Observable para seguir el progreso de la exportación
   */
  getUsersExportProgress(): Observable<MessageEvent> {
    return this.progressSubject.asObservable();
  }

  private emitProgress(message: string, data?: Record<string, any>) {
    this.progressSubject.next({
      data: JSON.stringify({
        message,
        data,
        timestamp: new Date().toISOString(),
      }),
    } as MessageEvent);
  }

  /**
   * Versión que envía el progreso como texto plano al response
   * y luego envía el archivo Excel
   */
  async writeUsersExcelWithProgress(res: Response): Promise<void> {
    const writeProgress = (message: string, data?: Record<string, any>) => {
      const progressMsg = data
        ? `${message} - ${JSON.stringify(data)}\n`
        : `${message}\n`;
      res.write(progressMsg);
      // No necesitamos flush si configuramos bien los headers
    };

    writeProgress('🚀 Iniciando exportación...');

    const pageSize = 2000;
    let page = 0;
    let totalProcessed = 0;

    // Obtener total de registros
    const totalUsers = await this.userRepo.count();
    writeProgress('📊 Contando registros', { totalUsers });

    // Crear un buffer para el Excel en memoria
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // Cabecera
    worksheet.addRow(['ID', 'First Name', 'Last Name', 'Email']);
    writeProgress('📝 Cabecera creada');

    while (true) {
      const users = await this.userRepo.find({
        skip: page * pageSize,
        take: pageSize,
        order: { id: 'ASC' },
      });

      if (!users.length) {
        break;
      }

      for (const u of users) {
        worksheet.addRow([u.id, u.firstName, u.lastName, u.email]);
        totalProcessed++;
      }

      page++;
      const progress = Math.round((totalProcessed / totalUsers) * 100);
      writeProgress(`⚙️  Procesando página ${page}`, {
        processed: totalProcessed,
        total: totalUsers,
        progress: `${progress}%`,
      });

      // Pausa para que se vea el progreso
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    writeProgress('💾 Generando archivo Excel...');
    writeProgress(
      '⚠️  Nota: El archivo se descargará, pero el progreso se cortará aquí',
    );

    // IMPORTANTE: Limpiar los headers de texto y configurar para Excel
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (res as any).removeHeader('Content-Type');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="users_export.xlsx"',
    );

    // Escribir el Excel al response (esto va a "romper" el stream de texto)
    await workbook.xlsx.write(res);

    this.logger.log(`Excel with progress completed, pages processed: ${page}`);
  }

  /**
   * Escribe el Excel directo sobre el stream del response (WorkbookWriter),
   * leyendo la BD por páginas.
   */
  async writeUsersExcelToStream(outputStream: any): Promise<void> {
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      stream: outputStream,
      useStyles: false,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet('Users');

    // Cabecera
    worksheet.addRow(['ID', 'First Name', 'Last Name', 'Email']).commit();
    this.emitProgress('Iniciando exportación...');

    const pageSize = 2000;
    let page = 0;
    let totalProcessed = 0;

    // Obtener total de registros para calcular porcentaje
    const totalUsers = await this.userRepo.count();
    this.emitProgress('Contando registros...', { totalUsers });

    while (true) {
      const users = await this.userRepo.find({
        skip: page * pageSize,
        take: pageSize,
        order: { id: 'ASC' },
      });

      if (!users.length) {
        break;
      }

      for (const u of users) {
        worksheet.addRow([u.id, u.firstName, u.lastName, u.email]).commit();
        totalProcessed++;
      }

      page++;
      const progress = Math.round((totalProcessed / totalUsers) * 100);
      this.emitProgress(`Procesando página ${page}...`, {
        page,
        processed: totalProcessed,
        total: totalUsers,
        progress: `${progress}%`,
      });
    }

    this.emitProgress('Finalizando archivo...');
    await workbook.commit(); // termina el XLSX y cierra el stream
    this.emitProgress('Exportación completada', {
      totalPages: page,
      totalProcessed,
    });
    this.logger.log(`Excel commit done, pages processed: ${page}`);
  }
}
