import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SendMessageDto {
  @ApiProperty() @IsString() receiverId: string;
  @ApiProperty() @IsString() @MinLength(1) subject: string;
  @ApiProperty() @IsString() @MinLength(1) content: string;
}

class CreateSupportTicketDto {
  @ApiProperty() @IsString() @MinLength(1) subject: string;
  @ApiProperty() @IsString() @MinLength(1) description: string;
  @ApiProperty({ required: false, default: 'MEDIUM' })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;
}

@ApiTags('Messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Get('inbox')
  @ApiOperation({ summary: 'Get inbox messages', description: 'Paginated list of received messages' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getInbox(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagingService.getInbox(userId, page, limit);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get sent messages', description: 'Paginated list of sent messages' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getSent(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagingService.getSent(userId, page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  sendMessage(
    @CurrentUser('id') senderId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(
      senderId,
      dto.receiverId,
      dto.subject,
      dto.content,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID', description: 'Returns a single message and marks it as read' })
  getMessage(@Param('id') id: string) {
    return this.messagingService.getMessage(id);
  }

  @Get('support/tickets')
  @ApiOperation({ summary: 'Get support tickets', description: 'Returns support tickets for the current student' })
  getSupportTickets(@CurrentUser('id') userId: string) {
    return this.messagingService.getSupportTickets(userId);
  }

  @Post('support')
  @ApiOperation({ summary: 'Create support ticket' })
  createSupportTicket(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSupportTicketDto,
  ) {
    return this.messagingService.createSupportTicket(
      userId,
      dto.subject,
      dto.description,
      dto.priority,
    );
  }
}
