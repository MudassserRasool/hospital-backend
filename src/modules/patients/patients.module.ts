import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { UsersModule } from '../users/users.module';
import { PatientsController } from './patients.controller';

@Module({
  imports: [ProfilesModule, UsersModule, AuthModule],
  controllers: [PatientsController],
})
export class PatientsModule {}
