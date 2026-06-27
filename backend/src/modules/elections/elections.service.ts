import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ElectionsFactory, IntegrationMode } from './elections.factory';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ElectionsService {
  constructor(
    private electionsFactory: ElectionsFactory,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getStrategy() {
    return this.electionsFactory.getStrategy();
  }

  async getElections() {
    const data = await this.getStrategy().getElections();
    return { success: true, data };
  }

  async getElectionById(id: string) {
    const data = await this.getStrategy().getElectionById(id);
    return { success: true, data };
  }

  async getCandidates(electionId: string) {
    const data = await this.getStrategy().getCandidates(electionId);
    return { success: true, data };
  }

  async castVote(electionId: string, candidateId: string, userId: string) {
    // Resolve student ID from user
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const data = await this.getStrategy().castVote(
      electionId,
      candidateId,
      student.id,
    );

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'VOTE',
        entity: 'Election',
        entityId: electionId,
        changes: { candidateId, method: 'PORTAL' },
      },
    });

    return data;
  }

  async checkEligibility(electionId: string, userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return this.getStrategy().checkEligibility(electionId, student.id);
  }

  async getResults(electionId: string) {
    return this.getStrategy().getResults(electionId);
  }

  async getVoteHistory(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const data = await this.getStrategy().getVoteHistory(student.id);
    return { success: true, data };
  }

  /**
   * Simulates JWT exchange from portal JWT to a UniElection voting JWT.
   * In production, this would validate the portal JWT and exchange it for a
   * short-lived voting token from the UniElection backend.
   */
  async exchangeJwt(portalJwt: string) {
    try {
      // Decode the portal JWT (verify using the same secret in production)
      const jwt = require('jsonwebtoken');
      const secret = this.configService.get<string>('JWT_SECRET', 'ku-portal-jwt-secret');
      const decoded = jwt.verify(portalJwt, secret);

      // Create a mock voting JWT for UniElection
      const votingSecret = this.configService.get<string>(
        'UNIELECTION_VOTING_SECRET',
        'unielection-voting-secret-dev',
      );

      const votingToken = jwt.sign(
        {
          sub: decoded.sub,
          username: decoded.username,
          role: decoded.role,
          electionScope: 'student',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        },
        votingSecret,
        { issuer: 'ku-portal' },
      );

      // Log the exchange
      await this.prisma.integrationLog.create({
        data: {
          event: 'JWT_EXCHANGE',
          requestPayload: { userId: decoded.sub },
          responsePayload: {
            tokenExpiry: new Date(Date.now() + 3600 * 1000).toISOString(),
            scope: 'student',
          },
          status: 'SUCCESS',
        },
      });

      return {
        success: true,
        data: {
          votingToken,
          expiresIn: 3600,
          scope: 'student',
          issuer: 'ku-portal',
        },
      };
    } catch (error: any) {
      await this.prisma.integrationLog.create({
        data: {
          event: 'JWT_EXCHANGE',
          requestPayload: {},
          responsePayload: { error: error.message || 'Invalid token' },
          status: 'FAILED',
        },
      });
      throw new UnauthorizedException('Invalid or expired portal JWT');
    }
  }

  /**
   * Verifies a voting JWT issued by this portal for UniElection.
   */
  async verifyVotingJwt(token: string) {
    try {
      const jwt = require('jsonwebtoken');
      const votingSecret = this.configService.get<string>(
        'UNIELECTION_VOTING_SECRET',
        'unielection-voting-secret-dev',
      );

      const decoded = jwt.verify(token, votingSecret, { issuer: 'ku-portal' });

      return {
        success: true,
        data: {
          valid: true,
          userId: decoded.sub,
          username: decoded.username,
          role: decoded.role,
          scope: decoded.electionScope,
          issuedAt: new Date(decoded.iat * 1000).toISOString(),
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: { valid: false, reason: error.message || 'Invalid voting token' },
      };
    }
  }

  async getConfig() {
    const config = await this.prisma.integrationConfig.findMany({
      orderBy: { name: 'asc' },
    });

    return { success: true, data: config };
  }

  async getIntegrationLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.integrationLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.integrationLog.count(),
    ]);

    return {
      success: true,
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async testConnectivity() {
    const mode = this.electionsFactory.resolveMode();

    if (mode === 'mock') {
      return {
        success: true,
        message: 'Mock mode active. No external connectivity required.',
        mode,
        status: 'operational',
      };
    }

    if (mode === 'iframe') {
      const url = process.env.UNIELECTION_URL;
      if (!url) {
        return {
          success: false,
          message: 'UNIELECTION_URL is not configured',
          mode,
          status: 'misconfigured',
        };
      }

      return {
        success: true,
        message: `Iframe mode configured with URL: ${url}. Connectivity test would ping UniElection in production.`,
        mode,
        status: 'configured',
      };
    }

    if (mode === 'sdk') {
      const apiKey = process.env.UNIELECTION_API_KEY;
      const apiUrl = process.env.UNIELECTION_API_URL;

      if (!apiKey || !apiUrl) {
        return {
          success: false,
          message: 'UNIELECTION_API_KEY and/or UNIELECTION_API_URL not configured',
          mode,
          status: 'misconfigured',
        };
      }

      return {
        success: true,
        message: `SDK mode configured with URL: ${apiUrl}. Connectivity test would ping UniElection API in production.`,
        mode,
        status: 'configured',
      };
    }

    return { success: false, message: 'Unknown integration mode', mode, status: 'unknown' };
  }

  async toggleMode(mode: IntegrationMode) {
    const validModes: IntegrationMode[] = ['mock', 'iframe', 'sdk'];

    if (!validModes.includes(mode)) {
      return {
        success: false,
        message: `Invalid mode "${mode}". Must be one of: ${validModes.join(', ')}`,
      };
    }

    // Update integration config in database
    await this.prisma.integrationConfig.upsert({
      where: { name: 'INTEGRATION_MODE' },
      create: { name: 'INTEGRATION_MODE', value: mode },
      update: { value: mode },
    });

    // Log the mode toggle
    await this.prisma.integrationLog.create({
      data: {
        event: 'MODE_TOGGLE',
        requestPayload: { mode },
        responsePayload: { previousMode: this.electionsFactory.resolveMode(), newMode: mode },
        status: 'SUCCESS',
      },
    });

    return {
      success: true,
      message: `Integration mode changed to "${mode}". Restart may be required for full effect.`,
      mode,
    };
  }
}
