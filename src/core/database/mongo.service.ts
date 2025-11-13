import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { MongoClient } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  // private client: MongoClient;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Initialize MongoDB connection
    console.log('MongoDB connection initialized');
  }

  async onModuleDestroy() {
    // Close MongoDB connection
    console.log('MongoDB connection closed');
  }
}
