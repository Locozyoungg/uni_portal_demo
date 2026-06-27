import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('library')
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Get('borrowed')
  @ApiOperation({ summary: 'Get borrowed books for the current student' })
  getBorrowedBooks(@CurrentUser() user: any) {
    return this.libraryService.getBorrowedBooks(user.id);
  }

  @Get('fines')
  @ApiOperation({ summary: 'Get fines for the current student' })
  getFines(@CurrentUser() user: any) {
    return this.libraryService.getFines(user.id);
  }

  @Get('reservations')
  @ApiOperation({ summary: 'Get active reservations for the current student' })
  getReservations(@CurrentUser() user: any) {
    return this.libraryService.getReservations(user.id);
  }

  @Get('digital-resources')
  @ApiOperation({ summary: 'Get digital resources, optionally filtered by category' })
  @ApiQuery({ name: 'category', required: false, type: String })
  getDigitalResources(
    @CurrentUser() user: any,
    @Query('category') category?: string,
  ) {
    return this.libraryService.getDigitalResources(category);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get library summary status for the current student' })
  getLibraryStatus(@CurrentUser() user: any) {
    return this.libraryService.getLibraryStatus(user.id);
  }
}
