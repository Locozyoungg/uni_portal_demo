import { Injectable } from '@nestjs/common';
import { ElectionStrategy } from './election-strategy.interface';

/**
 * Iframe strategy for UniElection integration.
 * In production, this would make HTTP calls to a configured UniElection backend
 * and render elections via iframe embed. Currently returns structured mock
 * responses indicating the UniElection URL needs to be configured.
 */
@Injectable()
export class IframeStrategy implements ElectionStrategy {
  private readonly unielectionUrl: string;

  constructor() {
    this.unielectionUrl = process.env.UNIELECTION_URL || '';
  }

  private getConfigError(method: string): never {
    throw new Error(
      `[UniElection Iframe] ${method} is not available in iframe mode. ` +
      `Configure UNIELECTION_URL in environment variables. ` +
      `Elections are rendered via iframe embed at: ${this.unielectionUrl || 'not configured'}`,
    );
  }

  async getElections(): Promise<any[]> {
    if (!this.unielectionUrl) {
      this.getConfigError('getElections');
    }

    return [
      {
        id: 'iframe-stub',
        title: 'Student Council Elections 2026',
        description: 'Elections are managed via UniElection. Access the voting interface through the embedded iframe.',
        type: 'STUDENT_BODY',
        status: 'ACTIVE',
        unielectionUrl: `${this.unielectionUrl}/elections`,
        embedUrl: `${this.unielectionUrl}/embed/elections`,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  async getElectionById(id: string): Promise<any> {
    if (!this.unielectionUrl) {
      this.getConfigError('getElectionById');
    }

    return {
      id,
      title: 'Student Council Elections 2026',
      description: 'View and manage this election through the UniElection iframe.',
      type: 'STUDENT_BODY',
      status: 'ACTIVE',
      embedUrl: `${this.unielectionUrl}/embed/elections/${id}`,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async getCandidates(electionId: string): Promise<any[]> {
    if (!this.unielectionUrl) {
      this.getConfigError('getCandidates');
    }

    return [
      {
        id: 'iframe-candidate-stub',
        electionId,
        name: 'Candidates available via UniElection',
        position: 'View in iframe',
        manifesto: 'Candidate details are managed in the UniElection system. ' +
          'Access them through the embedded iframe at the election page.',
        voteCount: 0,
      },
    ];
  }

  async castVote(
    electionId: string,
    candidateId: string,
    studentId: string,
    token?: string,
  ): Promise<any> {
    this.getConfigError('castVote');
  }

  async getResults(electionId: string): Promise<any> {
    if (!this.unielectionUrl) {
      this.getConfigError('getResults');
    }

    return {
      success: true,
      data: {
        id: electionId,
        title: 'Student Council Elections 2026',
        status: 'ACTIVE',
        totalVotes: 0,
        message: 'Live results are available through the UniElection iframe.',
        resultsUrl: `${this.unielectionUrl}/embed/elections/${electionId}/results`,
      },
    };
  }

  async getVoteHistory(studentId: string): Promise<any[]> {
    return [
      {
        id: 'iframe-history-stub',
        election: { title: 'Vote history available via UniElection', status: 'COMPLETED' },
        candidate: { name: 'View in UniElection portal' },
        votedAt: new Date().toISOString(),
        method: 'UNIELECTION_IFRAME',
        message: 'Detailed vote history is managed by UniElection.',
      },
    ];
  }

  async checkEligibility(
    electionId: string,
    studentId: string,
  ): Promise<{ eligible: boolean; reason?: string }> {
    if (!this.unielectionUrl) {
      return {
        eligible: false,
        reason: 'UniElection is not configured. Set UNIELECTION_URL environment variable.',
      };
    }

    return {
      eligible: true,
      reason: `Eligibility check forwarded to UniElection at ${this.unielectionUrl}. ` +
        `Final determination will be made via the iframe voting interface.`,
    };
  }
}
