/**
 * Voting Test Students Seed
 * =========================
 * Creates 10 student accounts specifically configured for voting/election testing.
 * IDEMPOTENT: skips students that already exist (checked by admissionNumber).
 *
 * All students get:
 *  - Election permissions for ALL active/upcoming elections
 *  - Active enrollment status
 *  - CLEAR fee status (allows voting)
 *
 * Usage:
 *   npx tsx prisma/seeds/seed-voting-test.ts
 *   or via Docker:
 *   docker exec ku-portal-backend npx tsx prisma/seeds/seed-voting-test.ts
 */

import { PrismaClient, Role, FeeStatus, EnrollmentStatus, ElectionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface VotingStudent {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  yearOfStudy: number;
  currentSemester: number;
  departmentName: string;
  facultyName: string;
  gpa: number;
}

const VOTING_STUDENTS: VotingStudent[] = [
  {
    admissionNumber: 'P100/V001/2023',
    firstName: 'Alex',
    lastName: 'Mwangi',
    email: 'a.mwangi@students.ku.ac.ke',
    yearOfStudy: 3,
    currentSemester: 2,
    departmentName: 'Department of Computer Science',
    facultyName: 'Faculty of Science',
    gpa: 3.5,
  },
  {
    admissionNumber: 'P100/V002/2023',
    firstName: 'Brenda',
    lastName: 'Chebet',
    email: 'b.chebet@students.ku.ac.ke',
    yearOfStudy: 4,
    currentSemester: 1,
    departmentName: 'Department of Computer Science',
    facultyName: 'Faculty of Science',
    gpa: 3.8,
  },
  {
    admissionNumber: 'P100/V003/2023',
    firstName: 'Collins',
    lastName: 'Otieno',
    email: 'c.otieno@students.ku.ac.ke',
    yearOfStudy: 2,
    currentSemester: 2,
    departmentName: 'Department of Electrical Engineering',
    facultyName: 'Faculty of Engineering',
    gpa: 2.9,
  },
  {
    admissionNumber: 'P100/V004/2023',
    firstName: 'Diana',
    lastName: 'Nyambura',
    email: 'd.nyambura@students.ku.ac.ke',
    yearOfStudy: 4,
    currentSemester: 1,
    departmentName: 'Department of English and Linguistics',
    facultyName: 'Faculty of Arts',
    gpa: 3.6,
  },
  {
    admissionNumber: 'P100/V005/2023',
    firstName: 'Eric',
    lastName: 'Kiprop',
    email: 'e.kiprop@students.ku.ac.ke',
    yearOfStudy: 3,
    currentSemester: 1,
    departmentName: 'Department of Computer Science',
    facultyName: 'Faculty of Science',
    gpa: 3.2,
  },
  {
    admissionNumber: 'P100/V006/2023',
    firstName: 'Faith',
    lastName: 'Wanjiku',
    email: 'f.wanjiku@students.ku.ac.ke',
    yearOfStudy: 2,
    currentSemester: 2,
    departmentName: 'Department of Computer Science',
    facultyName: 'Faculty of Science',
    gpa: 3.9,
  },
  {
    admissionNumber: 'P100/V007/2023',
    firstName: 'George',
    lastName: 'Ochieng',
    email: 'g.ochieng@students.ku.ac.ke',
    yearOfStudy: 4,
    currentSemester: 2,
    departmentName: 'Department of Mechanical Engineering',
    facultyName: 'Faculty of Engineering',
    gpa: 3.0,
  },
  {
    admissionNumber: 'P100/V008/2023',
    firstName: 'Hellen',
    lastName: 'Mutua',
    email: 'h.mutua@students.ku.ac.ke',
    yearOfStudy: 3,
    currentSemester: 1,
    departmentName: 'Department of Computer Science',
    facultyName: 'Faculty of Science',
    gpa: 3.4,
  },
  {
    admissionNumber: 'P100/V009/2023',
    firstName: 'Ian',
    lastName: 'Kamau',
    email: 'i.kamau@students.ku.ac.ke',
    yearOfStudy: 1,
    currentSemester: 2,
    departmentName: 'Department of Information Technology',
    facultyName: 'Faculty of Science',
    gpa: 3.1,
  },
  {
    admissionNumber: 'P100/V010/2023',
    firstName: 'Joyce',
    lastName: 'Akinyi',
    email: 'j.akinyi@students.ku.ac.ke',
    yearOfStudy: 4,
    currentSemester: 1,
    departmentName: 'Department of Computer Science',
    facultyName: 'Faculty of Science',
    gpa: 3.7,
  },
];

async function main() {
  console.log('=== Voting Test Students Seed ===\n');
  const passwordHash = await bcrypt.hash('password123', 8);

  // Pre-fetch structural data
  const faculties = await prisma.faculty.findMany();
  const departments = await prisma.department.findMany();
  const programmes = await prisma.programme.findMany();
  const schools = await prisma.school.findMany();
  const elections = await prisma.election.findMany({
    where: {
      status: { in: [ElectionStatus.ACTIVE, ElectionStatus.UPCOMING] },
      isVisible: true,
    },
  });

  console.log(`Found ${faculties.length} faculties, ${departments.length} departments`);
  console.log(`Found ${elections.length} active/upcoming elections\n`);

  let created = 0;
  let skipped = 0;

  for (const student of VOTING_STUDENTS) {
    // Check if student already exists
    const existing = await prisma.student.findUnique({
      where: { admissionNumber: student.admissionNumber },
    });

    if (existing) {
      console.log(`  ⏭ SKIP: ${student.admissionNumber} (${student.firstName} ${student.lastName}) — already exists`);
      skipped++;
      continue;
    }

    // Find department and faculty
    const dept = departments.find(d => d.name === student.departmentName);
    const faculty = faculties.find(f => f.name === student.facultyName);
    if (!dept || !faculty) {
      console.log(`  ❌ ERROR: Department or Faculty not found for ${student.admissionNumber}`);
      continue;
    }
    const school = schools.find(s => s.facultyId === faculty.id) || schools[0];
    const prog = programmes.find(p => p.departmentId === dept.id) || programmes[0];

    // Create User
    const user = await prisma.user.create({
      data: {
        username: student.admissionNumber,
        email: student.email,
        passwordHash,
        role: Role.STUDENT,
      },
    });

    // Create Student
    const createdStudent = await prisma.student.create({
      data: {
        userId: user.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: '0700000000',
        nationalId: `V${student.admissionNumber.replace(/\D/g, '').slice(-7)}`,
        yearOfStudy: student.yearOfStudy,
        currentSemester: student.currentSemester,
        feeStatus: FeeStatus.CLEAR,
        enrollmentStatus: EnrollmentStatus.ACTIVE,
        facultyId: faculty.id,
        schoolId: school.id,
        departmentId: dept.id,
        programmeId: prog.id,
      },
    });

    // Grant election permissions for ALL active/upcoming elections
    for (const election of elections) {
      await prisma.electionPermission.upsert({
        where: {
          studentId_electionId: {
            studentId: createdStudent.id,
            electionId: election.id,
          },
        },
        update: {
          canVote: true,
          isEligible: true,
          verifiedAt: new Date(),
        },
        create: {
          studentId: createdStudent.id,
          electionId: election.id,
          canVote: true,
          isEligible: true,
          verifiedAt: new Date(),
        },
      });
    }

    console.log(`  ✅ CREATED: ${student.admissionNumber} — ${student.firstName} ${student.lastName} (${student.departmentName}, Year ${student.yearOfStudy}, GPA ${student.gpa})`);
    created++;
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total students: ${await prisma.student.count()}`);
  console.log(`  Total users: ${await prisma.user.count()}`);
  console.log(`  Active/Upcoming elections they can vote in: ${elections.length}`);
  console.log(`\nAll passwords: password123`);
}

main()
  .catch((e) => {
    console.error('Voting test seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
