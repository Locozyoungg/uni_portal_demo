import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ElectionStrategy } from './election-strategy.interface';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class MockStrategy implements ElectionStrategy {
  constructor(private prisma: PrismaService) {}

  async getElections(): Promise<any[]> {
    return this.prisma.election.findMany({
      where: { isVisible: true },
      include: { _count: { select: { candidates: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async getElectionById(id: string): Promise<any> {
    const election = await this.prisma.election.findUnique({
      where: { id },
      include: {
        candidates: { orderBy: { name: 'asc' } },
        _count: { select: { voteRecords: true } },
      },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    return election;
  }

  async getCandidates(electionId: string): Promise<any[]> {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    return this.prisma.candidate.findMany({
      where: { electionId },
      orderBy: { name: 'asc' },
    });
  }

  async castVote(
    electionId: string,
    candidateId: string,
    studentId: string,
    token?: string,
  ): Promise<any> {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    if (election.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Election is not active. Current status: ${election.status}`,
      );
    }

    const now = new Date();
    if (now < election.startDate) {
      throw new BadRequestException('Election has not started yet');
    }
    if (now > election.endDate) {
      throw new BadRequestException('Election has already ended');
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, electionId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found in this election');
    }

    const existingVote = await this.prisma.voteRecord.findUnique({
      where: { studentId_electionId: { studentId, electionId } },
    });

    if (existingVote) {
      throw new BadRequestException('You have already voted in this election');
    }

    const transactionHash = uuidv4();

    const [voteRecord] = await this.prisma.$transaction([
      this.prisma.voteRecord.create({
        data: {
          studentId,
          electionId,
          candidateId,
          method: 'PORTAL',
          transactionHash,
        },
      }),
      this.prisma.candidate.update({
        where: { id: candidateId },
        data: { voteCount: { increment: 1 } },
      }),
    ]);

    // Log the integration activity
    await this.prisma.integrationLog.create({
      data: {
        event: 'VOTE_CAST',
        requestPayload: { electionId, candidateId, studentId, method: 'PORTAL' },
        responsePayload: { voteId: voteRecord.id, transactionHash },
        status: 'SUCCESS',
      },
    });

    return {
      success: true,
      data: {
        voteId: voteRecord.id,
        electionId,
        candidateId,
        candidateName: candidate.name,
        votedAt: voteRecord.votedAt,
        transactionHash,
        method: 'PORTAL',
      },
    };
  }

  async getResults(electionId: string): Promise<any> {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      include: {
        candidates: {
          orderBy: { voteCount: 'desc' },
        },
        _count: { select: { voteRecords: true } },
      },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    const totalVotes = election._count.voteRecords;
    const results = election.candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      position: candidate.position,
      photoUrl: candidate.photoUrl,
      voteCount: candidate.voteCount,
      percentage: totalVotes > 0
        ? Math.round((candidate.voteCount / totalVotes) * 100 * 100) / 100
        : 0,
    }));

    return {
      success: true,
      data: {
        id: election.id,
        title: election.title,
        type: election.type,
        status: election.status,
        totalVotes,
        candidates: results,
      },
    };
  }

  async getVoteHistory(studentId: string): Promise<any[]> {
    return this.prisma.voteRecord.findMany({
      where: { studentId },
      include: {
        election: { select: { id: true, title: true, type: true, status: true } },
        candidate: { select: { id: true, name: true, position: true } },
      },
      orderBy: { votedAt: 'desc' },
    });
  }

  async checkEligibility(
    electionId: string,
    studentId: string,
  ): Promise<{ eligible: boolean; reason?: string }> {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return { eligible: false, reason: 'Election not found' };
    }

    if (election.status === 'CANCELLED') {
      return { eligible: false, reason: 'Election has been cancelled' };
    }

    if (election.status === 'COMPLETED') {
      return { eligible: false, reason: 'Election has already ended' };
    }

    const now = new Date();
    if (now < election.startDate) {
      return { eligible: false, reason: 'Election has not started yet' };
    }

    // Check if student has already voted
    const existingVote = await this.prisma.voteRecord.findUnique({
      where: { studentId_electionId: { studentId, electionId } },
    });

    if (existingVote) {
      return { eligible: false, reason: 'You have already voted in this election' };
    }

    // Check ElectionPermission
    const permission = await this.prisma.electionPermission.findUnique({
      where: { studentId_electionId: { studentId, electionId } },
    });

    if (permission && !permission.canVote) {
      return { eligible: false, reason: 'You are not permitted to vote in this election' };
    }

    if (permission && !permission.isEligible) {
      return { eligible: false, reason: 'You are not eligible to vote in this election' };
    }

    return { eligible: true };
  }
}
