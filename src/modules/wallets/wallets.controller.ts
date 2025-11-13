import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Wallets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('me')
  @Roles('patient')
  @ApiOperation({ summary: 'Get my wallet' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  async getMyWallet(@CurrentUser() user: any) {
    // Get patient from user
    const wallet = await this.walletsService.getWalletByPatientId(user.patientId);
    return wallet;
  }

  @Get('me/balance')
  @Roles('patient')
  @ApiOperation({ summary: 'Get my wallet balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getMyBalance(@CurrentUser() user: any) {
    const balance = await this.walletsService.getBalance(user.patientId);
    return { balance };
  }

  @Get('me/transactions')
  @Roles('patient')
  @ApiOperation({ summary: 'Get my transaction history' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getMyTransactions(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('type') type?: 'credit' | 'debit',
  ) {
    return this.walletsService.getTransactions(user.patientId, {
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
      type,
    });
  }

  @Get('patient/:patientId')
  @Roles('receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Get wallet by patient ID' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  async getWalletByPatient(@Param('patientId') patientId: string) {
    return this.walletsService.getWalletByPatientId(patientId);
  }

  @Get('patient/:patientId/transactions')
  @Roles('receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Get patient transaction history' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getPatientTransactions(
    @Param('patientId') patientId: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('type') type?: 'credit' | 'debit',
  ) {
    return this.walletsService.getTransactions(patientId, {
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
      type,
    });
  }

  @Post('credit')
  @Roles('super_admin', 'owner')
  @ApiOperation({ summary: 'Credit wallet (admin only)' })
  @ApiResponse({ status: 200, description: 'Wallet credited successfully' })
  async creditWallet(
    @Body('patientId') patientId: string,
    @Body('amount') amount: number,
    @Body('description') description: string,
  ) {
    return this.walletsService.creditWallet(patientId, amount, description);
  }
}
