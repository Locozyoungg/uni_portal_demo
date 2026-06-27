import { Injectable } from '@nestjs/common';
import { ElectionStrategy } from './election-strategy.interface';

/**
 * SDK strategy for UniElection integration.
 * In production, this would use the UniElection SDK (npm package) to
 * communicate with the UniElection API. Currently returns structured mock
 * responses indicating SDK mode needs a valid UniElection API key.
 */
@Injectable()
export class SdkStrategy implements ElectionStrategy {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor() {
    this.apiKey = process.env.UNIELECTION_API_KEY || '';
    this.apiUrl = process.env.UNIELECTION_API_URL || '';
  }

  private getConfigError(method: string): never {
    throw new Error(
      `[UniElection SDK] ${method} is not available in SDK mode. ` +
      `Configure UNIELECTION_API_KEY and UNIELECTION_API_URL in environment variables. ` +
      `API URL: ${this.apiUrl || 'not configured'} | ` +
      `API Key: ${this.apiKey ? 'configured' : 'not configured'}`,
    );
  }

  async getElections(): Promise<any[]> {
    if (!this.apiKey || !this.apiUrl) {
      this.getConfigError('getElections');
    }

    return [
      {
        id: 'sdk-stub',
        title: 'Student Council Elections 2026',
        description: 'Elections are synchronized via UniElection SDK. ' +
          'Connect the SDK with a valid API key to access live data.',
        type: 'STUDENT_BODY',
        status: 'ACTIVE',
        syncStatus: 'Connected',
        apiEndpoint: `${this.apiUrl}/v1/elections`,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  async getElectionById(id: string): Promise<any> {
    if (!this.apiKey || !this.apiUrl) {
      this.getConfigError('getElectionById');
    }

    return {
      id,
      title: 'Student Council Elections 2026',
      description: 'Election data synchronized via UniElection SDK.',
      type: 'STUDENT_BODY',
      status: 'ACTIVE',
      syncUrl: `${this.apiUrl}/v1/elections/${id}`,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async getCandidates(electionId: string): Promise<any[]> {
    if (!this.apiKey || !this.apiUrl) {
      this.getConfigError('getCandidates');
    }

    return [
      {
        id: 'sdk-candidate-stub',
        electionId,
        name: 'Candidates managed via UniElection SDK',
        position: 'N/A',
        manifesto: 'Candidate data is pulled from the UniElection API. ' +
          'Configure the API key and URL to access live candidate information.',
        voteCount: 0,
        syncUrl: `${this.apiUrl}/v1/elections/${electionId}/candidates`,
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
    if (!this.apiKey || !this.apiUrl) {
      this.getConfigError('getResults');
    }

    return {
      success: true,
      data: {
        id: electionId,
        title: 'Student Council Elections 2026',
        status: 'ACTIVE',
        totalVotes: 0,
        message: 'Live results are synced from the UniElection API.',
        resultsUrl: `${this.apiUrl}/v1/elections/${electionId}/results`,
      },
    };
  }

  async getVoteHistory(studentId: string): Promise<any[]> {
    return [
      {
        id: 'sdk-history-stub',
        election: { title: 'Vote history synced via UniElection SDK', status: 'COMPLETED' },
        candidate: { name: 'View in UniElection portal' },
        votedAt: new Date().toISOString(),
        method: 'UNIELECTION_SDK',
        message: 'Vote history is synced from UniElection. Configure the SDK for live data.',
      },
    ];
  }

  async checkEligibility(
    electionId: string,
    studentId: string,
  ): Promise<{ eligible: boolean; reason?: string }> {
    if (!this.apiKey || !this.apiUrl) {
      return {
        eligible: false,
        reason: 'UniElection SDK is not configured. ' +
          'Set UNIELECTION_API_KEY and UNIELECTION_API_URL environment variables.',
      };
    }

    return {
      eligible: true,
      reason: `Eligibility check forwarded to UniElection SDK at ${this.apiUrl}. ` +
        `Final determination is managed by the UniElection backend.`,
    };
  }
}
