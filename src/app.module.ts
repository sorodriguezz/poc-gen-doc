import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      username: process.env.DB_USER || 'poc_user',
      password: process.env.DB_PASSWORD || 'poc_pass',
      database: process.env.DB_NAME || 'poc_db',
      entities: [User],
      synchronize: false,
    }),
    ReportsModule,
  ],
})
export class AppModule {}
