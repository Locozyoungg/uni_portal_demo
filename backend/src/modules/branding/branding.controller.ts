import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BrandingService } from './branding.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Branding')
@Controller('branding')
export class BrandingController {
  constructor(private brandingService: BrandingService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get public branding', description: 'Returns the portal branding configuration (public endpoint)' })
  getPublicBranding() {
    return this.brandingService.getPublicBranding();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update branding', description: 'Update the portal branding configuration (admin only)' })
  updateBranding(@Body() data: {
    universityName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    darkModeEnabled?: boolean;
    lightModeEnabled?: boolean;
  }) {
    return this.brandingService.updateBranding(data);
  }
}
