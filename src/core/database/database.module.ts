import { Module } from '@nestjs/common';
// Import your database services here
// Example: import { MongoService } from './mongo.service';

@Module({
  providers: [
    // Add database services here
  ],
  exports: [
    // Export database services here
  ],
})
export class DatabaseModule {}
