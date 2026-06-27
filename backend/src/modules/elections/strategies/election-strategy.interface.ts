export interface ElectionStrategy {
  getElections(): Promise<any[]>;
  getElectionById(id: string): Promise<any>;
  getCandidates(electionId: string): Promise<any[]>;
  castVote(
    electionId: string,
    candidateId: string,
    studentId: string,
    token?: string,
  ): Promise<any>;
  getResults(electionId: string): Promise<any>;
  getVoteHistory(studentId: string): Promise<any[]>;
  checkEligibility(
    electionId: string,
    studentId: string,
  ): Promise<{ eligible: boolean; reason?: string }>;
}
