import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { AddCreditDto, DebitCreditDto } from './dto/update-wallet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Wallets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @Roles('patient', 'receptionist')
  @ApiOperation({ summary: 'Create wallet for patient' })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(createWalletDto);
  }

  @Get(':patientId')
  @Roles('patient', 'receptionist', 'owner')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  getWallet(@Param('patientId') patientId: string) {
    return this.walletsService.findByPatientId(patientId);
  }

  @Get(':patientId/balance')
  @Roles('patient', 'receptionist', 'owner')
  @ApiOperation({ summary: 'Get wallet balance only' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  getBalance(@Param('patientId') patientId: string) {
    return this.walletsService.getBalance(patientId);
  }

  @Get(':patientId/transactions')
  @Roles('patient', 'receptionist', 'owner')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  getTransactions(@Param('patientId') patientId: string, @Query('limit') limit?: number) {
    return this.walletsService.getTransactions(patientId, limit);
  }

  @Post(':patientId/credit')
  @Roles('receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Add credit to wallet' })
  @ApiResponse({ status: 200, description: 'Credit added successfully' })
  addCredit(@Param('patientId') patientId: string, @Body() dto: AddCreditDto) {
    return this.walletsService.addCredit(
      patientId,
      dto.amount,
      dto.description,
      dto.relatedAppointmentId,
      dto.relatedPaymentId,
    );
  }

  @Post(':patientId/debit')
  @Roles('receptionist', 'owner')
  @ApiOperation({ summary: 'Deduct credit from wallet' })
  @ApiResponse({ status: 200, description: 'Credit deducted successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance' })
  debit(@Param('patientId') patientId: string, @Body() dto: DebitCreditDto) {
    return this.walletsService.debit(
      patientId,
      dto.amount,
      dto.description,
      dto.relatedAppointmentId,
    );
  }
}
