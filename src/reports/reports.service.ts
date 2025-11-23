import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

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

    const pageSize = 2000;
    let page = 0;

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
      }

      page++;
    }

    await workbook.commit(); // termina el XLSX y cierra el stream
    this.logger.log(`Excel commit done, pages processed: ${page}`);
  }
}
