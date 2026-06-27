import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BrandingService {
  constructor(private prisma: PrismaService) {}

  private readonly defaultBranding = {
    universityName: 'Demo University',
    logoUrl: null,
    primaryColor: '#1a56db',
    secondaryColor: '#7c3aed',
    accentColor: '#06b6d4',
    fontFamily: 'Inter',
    darkModeEnabled: true,
    lightModeEnabled: true,
  };

  async getBranding() {
    const configs = await this.prisma.integrationConfig.findMany({
      where: {
        name: {
          in: [
            'BRANDING_UNIVERSITY_NAME',
            'BRANDING_LOGO_URL',
            'BRANDING_PRIMARY_COLOR',
            'BRANDING_SECONDARY_COLOR',
            'BRANDING_ACCENT_COLOR',
            'BRANDING_FONT_FAMILY',
            'BRANDING_DARK_MODE',
            'BRANDING_LIGHT_MODE',
          ],
        },
      },
    });

    const brandingMap: Record<string, string> = {};
    for (const config of configs) {
      const key = config.name.replace('BRANDING_', '').toLowerCase();
      brandingMap[key] = config.value;
    }

    return {
      success: true,
      data: {
        universityName: brandingMap['university_name'] || this.defaultBranding.universityName,
        logoUrl: brandingMap['logo_url'] || this.defaultBranding.logoUrl,
        primaryColor: brandingMap['primary_color'] || this.defaultBranding.primaryColor,
        secondaryColor: brandingMap['secondary_color'] || this.defaultBranding.secondaryColor,
        accentColor: brandingMap['accent_color'] || this.defaultBranding.accentColor,
        fontFamily: brandingMap['font_family'] || this.defaultBranding.fontFamily,
        darkModeEnabled: brandingMap['dark_mode'] !== 'false',
        lightModeEnabled: brandingMap['light_mode'] !== 'false',
      },
    };
  }

  async updateBranding(data: {
    universityName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    darkModeEnabled?: boolean;
    lightModeEnabled?: boolean;
  }) {
    const updates: { name: string; value: string }[] = [];

    if (data.universityName !== undefined) {
      updates.push({ name: 'BRANDING_UNIVERSITY_NAME', value: data.universityName });
    }
    if (data.logoUrl !== undefined) {
      updates.push({ name: 'BRANDING_LOGO_URL', value: data.logoUrl });
    }
    if (data.primaryColor !== undefined) {
      updates.push({ name: 'BRANDING_PRIMARY_COLOR', value: data.primaryColor });
    }
    if (data.secondaryColor !== undefined) {
      updates.push({ name: 'BRANDING_SECONDARY_COLOR', value: data.secondaryColor });
    }
    if (data.accentColor !== undefined) {
      updates.push({ name: 'BRANDING_ACCENT_COLOR', value: data.accentColor });
    }
    if (data.fontFamily !== undefined) {
      updates.push({ name: 'BRANDING_FONT_FAMILY', value: data.fontFamily });
    }
    if (data.darkModeEnabled !== undefined) {
      updates.push({ name: 'BRANDING_DARK_MODE', value: String(data.darkModeEnabled) });
    }
    if (data.lightModeEnabled !== undefined) {
      updates.push({ name: 'BRANDING_LIGHT_MODE', value: String(data.lightModeEnabled) });
    }

    if (updates.length > 0) {
      for (const update of updates) {
        await this.prisma.integrationConfig.upsert({
          where: { name: update.name },
          create: { name: update.name, value: update.value },
          update: { value: update.value },
        });
      }
    }

    return this.getBranding();
  }

  async getPublicBranding() {
    return this.getBranding();
  }
}
