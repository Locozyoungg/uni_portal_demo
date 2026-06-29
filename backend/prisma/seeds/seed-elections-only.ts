/**
 * Elections-Only Seed
 * ===================
 * Creates election data WITHOUT wiping existing data.
 * Safe to run on a database that already has students.
 *
 * Usage:
 *   npx tsx prisma/seeds/seed-elections-only.ts
 */

import { PrismaClient, ElectionStatus, ElectionType } from '@prisma/client';

const prisma = new PrismaClient();

const ELECTION_DATA = [
  {
    title: 'Student Council Elections 2026',
    description: 'Election for the 2026/2027 Student Council leadership. Positions include Chairperson, Vice Chairperson, Secretary General, Treasurer, and Organizing Secretary.',
    type: ElectionType.STUDENT_BODY,
    status: ElectionStatus.UPCOMING,
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-15'),
    candidates: [
      { name: 'James Omondi', position: 'Chairperson', manifesto: 'To foster academic excellence and improve student welfare through transparent leadership and inclusive governance.' },
      { name: 'Grace Akinyi', position: 'Chairperson', manifesto: 'A voice for every student. I will ensure equitable representation and enhanced campus facilities.' },
      { name: 'Peter Mwangi', position: 'Vice Chairperson', manifesto: 'Supporting the Chairperson in delivering quality leadership and championing student rights.' },
      { name: 'Faith Njeri', position: 'Secretary General', manifesto: 'Efficient communication and documentation to ensure student interests are well represented at all levels.' },
      { name: 'David Kiprop', position: 'Treasurer', manifesto: 'Transparent financial management and accountability for all student council funds.' },
    ],
  },
  {
    title: 'Department Representative - Computer Science',
    description: 'Elect your department representative for the Computer Science department. The representative will voice student concerns to the faculty board.',
    type: ElectionType.DEPARTMENT,
    status: ElectionStatus.ACTIVE,
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-07-15'),
    candidates: [
      { name: 'Esther Wambui', position: 'Department Representative', manifesto: 'Bridging the gap between students and faculty. I will ensure regular feedback sessions and academic support programs.' },
      { name: 'Daniel Kamau', position: 'Department Representative', manifesto: 'Enhancing practical learning opportunities through tech hubs, hackathons, and industry partnerships.' },
      { name: 'Sarah Nyambura', position: 'Department Representative', manifesto: 'A responsive and accessible representative who will address academic concerns promptly and fairly.' },
    ],
  },
  {
    title: 'Student Body President 2025',
    description: 'Election for the 2025/2026 Student Body President. The president represents all students at the university senate and external bodies.',
    type: ElectionType.STUDENT_BODY,
    status: ElectionStatus.COMPLETED,
    startDate: new Date('2025-09-01'),
    endDate: new Date('2025-09-20'),
    candidates: [
      { name: 'Kevin Kioko', position: 'President', manifesto: 'Transforming student welfare through digital innovation, improved hostel conditions, and enhanced library services.', voteCount: 452 },
      { name: 'Cynthia Muthoni', position: 'President', manifesto: 'Building a united student community focused on academic success, talent development, and social responsibility.', voteCount: 389 },
      { name: 'Brian Otieno', position: 'President', manifesto: 'Practical leadership with a focus on affordable education, job readiness programs, and mental health support.', voteCount: 278 },
    ],
  },
  {
    title: 'Faculty Representative - Science 2025',
    description: 'Elect your faculty representative to the university governing council.',
    type: ElectionType.FACULTY,
    status: ElectionStatus.COMPLETED,
    startDate: new Date('2025-10-01'),
    endDate: new Date('2025-10-15'),
    candidates: [
      { name: 'Dr. Susan Wanjiru', position: 'Faculty Representative', manifesto: 'Advancing research capacity through modern laboratory equipment and increased faculty research grants.', voteCount: 320 },
      { name: 'Prof. James Kuria', position: 'Faculty Representative', manifesto: 'Strengthening industry-academia partnerships and improving the quality of science education delivery.', voteCount: 245 },
      { name: 'Mercy Chebet', position: 'Faculty Representative', manifesto: 'Student-centered faculty governance with emphasis on mentorship and career development programs.', voteCount: 198 },
      { name: 'Samuel Ochieng', position: 'Faculty Representative', manifesto: 'Transparent faculty management and equitable resource allocation across all science departments.', voteCount: 156 },
    ],
  },
  {
    title: 'Special Referendum - Academic Calendar 2026',
    description: 'Referendum on the proposed change to a semester-based academic calendar from the current trimester system.',
    type: ElectionType.REFERENDUM,
    status: ElectionStatus.CANCELLED,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-03-14'),
    candidates: [
      { name: 'Yes', position: 'Referendum Option', manifesto: 'A semester system will allow deeper engagement with course material and reduce examination pressure on students.' },
      { name: 'No', position: 'Referendum Option', manifesto: 'The trimester system allows students to complete their degrees faster and join the job market earlier.' },
    ],
  },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoices<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('=== Elections-Only Seed ===\n');

  const existingElections = await prisma.election.count();
  if (existingElections > 0) {
    console.log(`Already have ${existingElections} elections. Skipping election creation.`);
    console.log('To re-create elections, delete existing ones first.');
    await prisma.$disconnect();
    return;
  }

  const studentIds = (await prisma.student.findMany({ select: { id: true } })).map(s => s.id);
  console.log(`Found ${studentIds.length} students for election permissions.\n`);

  for (const electionData of ELECTION_DATA) {
    const election = await prisma.election.create({
      data: {
        title: electionData.title,
        description: electionData.description,
        type: electionData.type,
        startDate: electionData.startDate,
        endDate: electionData.endDate,
        status: electionData.status,
        isVisible: electionData.status !== ElectionStatus.CANCELLED,
        unielectionId: electionData.status === ElectionStatus.COMPLETED ? `ue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : null,
        votingUrl: electionData.status === ElectionStatus.ACTIVE ? 'http://localhost:4000/vote' : null,
      },
    });

    // Create candidates
    for (const cand of electionData.candidates) {
      await prisma.candidate.create({
        data: {
          electionId: election.id,
          name: cand.name,
          position: cand.position,
          manifesto: cand.manifesto,
          voteCount: (cand as any).voteCount || 0,
        },
      });
    }

    // Grant permissions to 200 random students
    const eligible = randomChoices(studentIds, 200);
    for (const studentId of eligible) {
      await prisma.electionPermission.create({
        data: {
          studentId,
          electionId: election.id,
          canVote: electionData.status !== ElectionStatus.CANCELLED,
          isEligible: electionData.status !== ElectionStatus.CANCELLED,
          verifiedAt: new Date(),
        },
      });
    }

    // Vote records for completed elections
    if (electionData.status === ElectionStatus.COMPLETED) {
      const candidates = await prisma.candidate.findMany({ where: { electionId: election.id } });
      if (candidates.length > 0) {
        const voters = randomChoices(eligible, randomInt(40, 80));
        for (const studentId of voters) {
          const candidate = randomChoice(candidates);
          await prisma.voteRecord.create({
            data: {
              studentId,
              electionId: election.id,
              candidateId: candidate.id,
              method: 'PORTAL',
              transactionHash: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 15)}`,
            },
          }).catch(() => {}); // ignore duplicates
        }
      }
    }

    console.log(`  ✅ ${electionData.title} (${electionData.status}) — ${electionData.candidates.length} candidates, ${eligible.length} eligible voters`);
  }

  console.log(`\n=== Done ===`);
  console.log(`  Elections: ${await prisma.election.count()}`);
  console.log(`  Candidates: ${await prisma.candidate.count()}`);
  console.log(`  Vote Records: ${await prisma.voteRecord.count()}`);
  console.log(`  Election Permissions: ${await prisma.electionPermission.count()}`);
}

main()
  .catch((e) => {
    console.error('Elections seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
