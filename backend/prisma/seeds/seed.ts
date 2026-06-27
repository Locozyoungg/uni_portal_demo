import {
  PrismaClient,
  Role,
  FeeStatus,
  EnrollmentStatus,
  CourseStatus,
  InvoiceStatus,
  BorrowStatus,
  HostelType,
  ElectionType,
  ElectionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ────────────────────────────────────────────
// Data Generators
// ────────────────────────────────────────────

const KENYAN_FIRST_NAMES = [
  'James', 'Mary', 'John', 'Grace', 'Peter', 'Faith', 'David', 'Esther',
  'Daniel', 'Sarah', 'Samuel', 'Elizabeth', 'Joseph', 'Margaret', 'Paul', 'Jane',
  'George', 'Alice', 'Michael', 'Ruth', 'Stephen', 'Dorothy', 'Patrick', 'Lucy',
  'Robert', 'Ann', 'Kennedy', 'Nancy', 'Thomas', 'Susan', 'Charles', 'Joyce',
  'Simon', 'Janet', 'Francis', 'Catherine', 'Vincent', 'Dorcas', 'Bernard', 'Florence',
  'Timothy', 'Agnes', 'Dennis', 'Beatrice', 'Philip', 'Veronica', 'Andrew', 'Teresa',
  'Nicholas', 'Rosemary', 'Anthony', 'Priscilla', 'Julius', 'Monica', 'Christopher', 'Lydia',
  'Duncan', 'Lilian', 'Moses', 'Mercy', 'Douglas', 'Naomi', 'Kevin', 'Diana',
  'Brian', 'Martha', 'Eric', 'Rebecca', 'Edward', 'Eunice', 'Fredrick', 'Hellen',
  'Geoffrey', 'Irene', 'Gerald', 'Jackline', 'Henry', 'Caroline', 'Isaac', 'Millicent',
  'Jacob', 'Edith', 'Jeff', 'Peris', 'Joel', 'Selina', 'Joshua', 'Brenda',
  'Lawrence', 'Cynthia', 'Linus', 'Everline', 'Mathew', 'Gladys', 'Nathan', 'Emily',
  'Nelson', 'Dorine', 'Oscar', 'Consolata', 'Raymond', 'Bridget', 'Richard', 'Magdalene',
  'Samuel', 'Rose', 'Stanley', 'Peninah', 'Steve', 'Sheila', 'Tom', 'Sophia',
  'Victor', 'Purity', 'Walter', 'Evelyn', 'Wycliffe', 'Faith', 'Zachary', 'Susan',
  'Abraham', 'Deborah', 'Albert', 'Cecilia', 'Benjamin', 'Sharon', 'Collins', 'Norah',
  'Dominic', 'Lilian', 'Emmanuel', 'Margret', 'Ezekiel', 'Rachel', 'Felix', 'Rahab',
  'Gabriel', 'Benadette', 'Harrison', 'Julia', 'Ian', 'Phoebe', 'Jared', 'Edna',
  'Kiprono', 'Tabitha', 'Kiplagat', 'Janet', 'Langat', 'Serah', 'Mwariri', 'Wambui',
  'Ndungu', 'Waithera', 'Kamau', 'Njeri', 'Ochieng', 'Atieno', 'Otieno', 'Akinyi',
  'Wanjiku', 'Muthoni', 'Kioko', 'Mwende', 'Mutua', 'Kemunto', 'Kiprop', 'Jelagat',
];

const KENYAN_LAST_NAMES = [
  'Kamau', 'Wanjiku', 'Mutua', 'Njeri', 'Ochieng', 'Akinyi', 'Kioko', 'Mwende',
  'Ndungu', 'Wambui', 'Kiprop', 'Chebet', 'Kiprono', 'Jelagat', 'Otieno', 'Achieng',
  'Mwangi', 'Nyambura', 'Njoroge', 'Wairimu', 'Macharia', 'Nyokabi', 'Kimani', 'Wanjiru',
  'Kariuki', 'Nyambura', 'Omondi', 'Awuor', 'Barasa', 'Naliaka', 'Wekesa', 'Nekesa',
  'Kisaka', 'Nanzala', 'Mwita', 'Mokeira', 'Chumba', 'Kosgey', 'Kenei', 'Chepkorir',
  'Rotich', 'Biwott', 'Kogo', 'Chepkoech', 'Mitei', 'Cherotich', 'Yego', 'Cheptegei',
  'Kiprop', 'Kemboi', 'Mutai', 'Mosoti', 'Olang', 'Owino', 'Okoth', 'Owiti',
  'Were', 'Oduor', 'Ojwang', 'Nyaboke', 'Opondo', 'Achieng', 'Omari', 'Mwita',
  'Mose', 'Nyakundi', 'Momanyi', 'Mogaka', 'Oracha', 'Obure', 'Ogaro', 'Mokaya',
  'Bosire', 'Morara', 'Nyambega', 'Kengere', 'Angwenyi', 'Machani', 'Mwangi', 'Kuria',
  'Gichane', 'Kiratu', 'Karau', 'Wacira', 'Gathua', 'Baraka', 'Mathenge', 'Gitau',
  'Maina', 'Wanjohi', 'Githinji', 'Ndichu', 'Kanyi', 'Mbote', 'Ngunjiri', 'Irungu',
  'Thuo', 'Kiarie', 'Hinga', 'Wanyoike', 'Chege', 'Ndirangu', 'Gachugi', 'Muchiri',
  'Kairu', 'Gikonyo', 'Kibe', 'Muiruri', 'Njenga', 'Mungai', 'Waweru', 'Njuguna',
  'Gitari', 'Mwaniki', 'Thuita', 'Kariba', 'Miriti', 'Mugambi', 'Kiringa', 'Nyaga',
  'Gatimu', 'Ciania', 'Mugendi', 'Kirimi', 'Muthomi', 'Rintari', 'Njue', 'Kathomi',
  'Gitonga', 'Muriuki', 'Miriti', 'Kaaria', 'Mbaabu', 'Mugwika', 'Ibuuri', 'Rwamba',
  'Njeru', 'Kirima', 'Miriti', 'Mburugu', 'Nyamu', 'Kinyua', 'Muthuri', 'Njoka',
  'Nyaga', 'Karanja', 'Ndegwa', 'Mungai', 'Ndungu', 'Mwangi', 'Githinji', 'Kamande',
];

const COURSE_PREFIXES: Record<string, string[]> = {
  'Faculty of Science': ['SCI', 'BIO', 'CHE', 'PHY', 'MAT', 'STA', 'COM'],
  'Faculty of Arts': ['ART', 'HIS', 'GEO', 'LIT', 'MUS', 'THE', 'LAN'],
  'Faculty of Engineering': ['ENG', 'CIV', 'MEC', 'ELE', 'INE', 'SOF', 'TEL'],
};

const COURSE_NAMES_BY_CODE: Record<string, string[]> = {
  SCI: ['Introduction to Scientific Reasoning', 'Research Methodology', 'Scientific Writing', 'Laboratory Techniques', 'Ethics in Science'],
  BIO: ['General Biology', 'Cell Biology', 'Genetics', 'Microbiology', 'Molecular Biology', 'Ecology', 'Biochemistry', 'Botany', 'Zoology', 'Evolutionary Biology'],
  CHE: ['General Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry', 'Environmental Chemistry', 'Polymer Chemistry'],
  PHY: ['General Physics', 'Mechanics', 'Thermodynamics', 'Quantum Physics', 'Electromagnetism', 'Nuclear Physics', 'Optics', 'Astrophysics'],
  MAT: ['Pure Mathematics', 'Applied Mathematics', 'Calculus I', 'Calculus II', 'Linear Algebra', 'Differential Equations', 'Numerical Analysis', 'Statistics', 'Real Analysis'],
  STA: ['Introduction to Statistics', 'Probability Theory', 'Statistical Inference', 'Regression Analysis', 'Time Series', 'Biostatistics', 'Data Science'],
  COM: ['Introduction to Computing', 'Programming Fundamentals', 'Data Structures', 'Algorithms', 'Database Systems', 'Software Engineering', 'Computer Networks', 'Web Development', 'Machine Learning', 'Cybersecurity'],
  ART: ['Introduction to Fine Art', 'Painting', 'Sculpture', 'Art History', 'Drawing', 'Printmaking', 'Digital Art', 'Ceramics', 'Photography', 'Visual Culture'],
  HIS: ['World History', 'African History', 'Kenyan History', 'Modern History', 'Ancient Civilizations', 'Historiography', 'Colonial History'],
  GEO: ['Physical Geography', 'Human Geography', 'Geographic Information Systems', 'Climatology', 'Geomorphology', 'Urban Geography'],
  LIT: ['Introduction to Literature', 'African Literature', 'English Literature', 'Literary Theory', 'Poetry', 'Drama', 'The Novel', 'Children\'s Literature'],
  MUS: ['Music Theory', 'Performance Studies', 'Music History', 'Composition', 'Ethnomusicology', 'Choral Music'],
  THE: ['Introduction to Theatre', 'Acting', 'Playwriting', 'Theatre History', 'Directing', 'Stage Design'],
  LAN: ['English Language', 'Linguistics', 'Swahili Language', 'French Language', 'Phonetics', 'Sociolinguistics'],
  ENG: ['Engineering Mathematics', 'Engineering Drawing', 'Engineering Mechanics', 'Materials Science', 'Fluid Mechanics', 'Engineering Thermodynamics', 'Strength of Materials'],
  CIV: ['Introduction to Civil Engineering', 'Structural Analysis', 'Geotechnical Engineering', 'Transportation Engineering', 'Hydraulics', 'Construction Management'],
  MEC: ['Mechanical Engineering Design', 'Manufacturing Processes', 'Dynamics of Machines', 'Heat Transfer', 'Renewable Energy', 'Mechanical Vibrations'],
  ELE: ['Electrical Circuits', 'Electronics I', 'Electronics II', 'Power Systems', 'Control Systems', 'Signals and Systems', 'Microprocessors'],
  INE: ['Industrial Engineering', 'Operations Research', 'Supply Chain Management', 'Quality Control', 'Ergonomics', 'Production Planning'],
  SOF: ['Software Engineering', 'Object-Oriented Programming', 'Web Technologies', 'Mobile App Development', 'Software Testing', 'Project Management'],
  TEL: ['Telecommunication Systems', 'Digital Communications', 'Network Security', 'Wireless Communications', 'Fiber Optics', 'Signal Processing'],
};

const BOOKS_DATA = [
  { isbn: '978-0-13-110362-7', title: 'The C Programming Language', author: 'Brian Kernighan, Dennis Ritchie', publisher: 'Prentice Hall', category: 'Programming' },
  { isbn: '978-0-596-51774-8', title: 'Learning Python', author: 'Mark Lutz', publisher: "O'Reilly Media", category: 'Programming' },
  { isbn: '978-1-491-95035-7', title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', publisher: "O'Reilly Media", category: 'Programming' },
  { isbn: '978-0-13-468599-1', title: 'Introduction to Algorithms', author: 'Thomas Cormen', publisher: 'MIT Press', category: 'Programming' },
  { isbn: '978-1-59327-584-6', title: 'The Art of Computer Programming', author: 'Donald Knuth', publisher: 'Addison-Wesley', category: 'Programming' },
  { isbn: '978-0-321-99278-9', title: 'Clean Code', author: 'Robert C. Martin', publisher: 'Prentice Hall', category: 'Programming' },
  { isbn: '978-1-4842-4861-8', title: 'Pro Spring Boot 2', author: 'Felipe Gutierrez', publisher: 'Apress', category: 'Programming' },
  { isbn: '978-1-449-33771-5', title: 'Node.js Design Patterns', author: 'Mario Casciaro', publisher: "O'Reilly Media", category: 'Programming' },
  { isbn: '978-0-13-235088-4', title: 'Design Patterns', author: 'Erich Gamma', publisher: 'Addison-Wesley', category: 'Programming' },
  { isbn: '978-1-492-03649-8', title: 'Database Systems: The Complete Book', author: 'Hector Garcia-Molina', publisher: 'Pearson', category: 'Programming' },
  { isbn: '978-0-13-148965-3', title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell, Peter Norvig', publisher: 'Pearson', category: 'Programming' },
  { isbn: '978-0-262-13472-9', title: 'Structure and Interpretation of Computer Programs', author: 'Harold Abelson', publisher: 'MIT Press', category: 'Programming' },
  { isbn: '978-0-07-352935-2', title: 'Engineering Mechanics: Dynamics', author: 'J.L. Meriam, L.G. Kraige', publisher: 'Wiley', category: 'Engineering' },
  { isbn: '978-1-119-30685-4', title: 'Fundamentals of Engineering Thermodynamics', author: 'Michael Moran', publisher: 'Wiley', category: 'Engineering' },
  { isbn: '978-0-07-339824-8', title: 'Mechanics of Materials', author: 'Ferdinand Beer', publisher: 'McGraw-Hill', category: 'Engineering' },
  { isbn: '978-0-13-421539-6', title: 'Fluid Mechanics', author: 'Frank White', publisher: 'McGraw-Hill', category: 'Engineering' },
  { isbn: '978-1-118-53197-0', title: 'Control Systems Engineering', author: 'Norman Nise', publisher: 'Wiley', category: 'Engineering' },
  { isbn: '978-0-13-376131-3', title: 'Digital Signal Processing', author: 'John Proakis', publisher: 'Pearson', category: 'Engineering' },
  { isbn: '978-0-07-286586-6', title: 'Electric Machinery Fundamentals', author: 'Stephen Chapman', publisher: 'McGraw-Hill', category: 'Engineering' },
  { isbn: '978-0-13-398303-6', title: 'Structural Analysis', author: 'Russell Hibbeler', publisher: 'Pearson', category: 'Engineering' },
  { isbn: '978-0-13-444460-4', title: 'Construction Planning and Management', author: 'Frederick Gould', publisher: 'Pearson', category: 'Engineering' },
  { isbn: '978-0-7506-8336-9', title: 'Renewable Energy Resources', author: 'John Twidell', publisher: 'Routledge', category: 'Engineering' },
  { isbn: '978-0-19-969740-3', title: 'A History of Kenya', author: 'William Ochieng', publisher: 'Oxford University Press', category: 'Arts' },
  { isbn: '978-0-435-91200-5', title: 'Things Fall Apart', author: 'Chinua Achebe', publisher: 'Heinemann', category: 'Literature' },
  { isbn: '978-0-14-118307-5', title: 'The River Between', author: 'Ngugi wa Thiong\'o', publisher: 'Penguin', category: 'Literature' },
  { isbn: '978-0-14-310676-4', title: 'Weep Not, Child', author: 'Ngugi wa Thiong\'o', publisher: 'Penguin', category: 'Literature' },
  { isbn: '978-0-435-90951-7', title: 'The Lion and the Jewel', author: 'Wole Soyinka', publisher: 'Heinemann', category: 'Literature' },
  { isbn: '978-0-19-953905-5', title: 'Half of a Yellow Sun', author: 'Chimamanda Adichie', publisher: 'Oxford University Press', category: 'Literature' },
  { isbn: '978-0-14-303809-6', title: 'Petals of Blood', author: 'Ngugi wa Thiong\'o', publisher: 'Penguin', category: 'Literature' },
  { isbn: '978-0-521-85780-4', title: 'Introduction to Art History', author: 'Gardner', publisher: 'Cambridge University Press', category: 'Arts' },
  { isbn: '978-0-8109-7689-9', title: 'World Art: A Global History', author: 'Julian Bell', publisher: 'Abrams', category: 'Arts' },
  { isbn: '978-0-19-284205-5', title: 'African Art in Detail', author: 'John Picton', publisher: 'Oxford University Press', category: 'Arts' },
  { isbn: '978-0-19-510327-2', title: 'Music in Africa', author: 'Ruth Stone', publisher: 'Oxford University Press', category: 'Arts' },
  { isbn: '978-1-292-02262-7', title: 'General Biology', author: 'Campbell', publisher: 'Pearson', category: 'Science' },
  { isbn: '978-1-292-11947-0', title: 'Organic Chemistry', author: 'Wade', publisher: 'Pearson', category: 'Science' },
  { isbn: '978-0-321-80334-4', title: 'University Physics', author: 'Young and Freedman', publisher: 'Addison-Wesley', category: 'Science' },
  { isbn: '978-1-292-14119-8', title: 'Calculus: Early Transcendentals', author: 'James Stewart', publisher: 'Cengage', category: 'Science' },
  { isbn: '978-1-4641-4689-3', title: 'Molecular Biology of the Cell', author: 'Alberts', publisher: 'Garland Science', category: 'Science' },
  { isbn: '978-0-7167-4638-4', title: 'Introduction to Genetic Analysis', author: 'Griffiths', publisher: 'Freeman', category: 'Science' },
  { isbn: '978-1-292-15950-6', title: 'Probability and Statistics for Engineering', author: 'Walpole', publisher: 'Pearson', category: 'Science' },
  { isbn: '978-0-19-878525-7', title: 'Introduction to Environmental Science', author: 'Andrew Friedland', publisher: 'Oxford University Press', category: 'Science' },
  { isbn: '978-1-292-13724-5', title: 'Physics for Scientists and Engineers', author: 'Serway', publisher: 'Cengage', category: 'Science' },
  { isbn: '978-0-7167-3443-1', title: 'Biochemistry', author: 'Stryer', publisher: 'Freeman', category: 'Science' },
  { isbn: '978-0-13-570273-2', title: 'The Origin of Species', author: 'Charles Darwin', publisher: 'Princeton University Press', category: 'Science' },
  { isbn: '978-0-19-854086-3', title: 'The Selfish Gene', author: 'Richard Dawkins', publisher: 'Oxford University Press', category: 'Science' },
  { isbn: '978-0-300-20936-5', title: 'A Brief History of Time', author: 'Stephen Hawking', publisher: 'Yale University Press', category: 'Science' },
  { isbn: '978-0-14-043457-8', title: 'African Folktales', author: 'Paul Radin', publisher: 'Penguin', category: 'Literature' },
  { isbn: '978-0-435-90970-8', title: 'Mine Boy', author: 'Peter Abrahams', publisher: 'Heinemann', category: 'Literature' },
];

const DIGITAL_RESOURCES = [
  { title: 'Academic Writing Guide', url: '/resources/academic-writing-guide.pdf', category: 'Academic', accessLevel: 'STUDENT' },
  { title: 'Library Catalogue System', url: 'https://library.ku.ac.ke/catalogue', category: 'Library', accessLevel: 'STUDENT' },
  { title: 'E-Journal Portal', url: 'https://journals.ku.ac.ke', category: 'Research', accessLevel: 'STUDENT' },
  { title: 'Online Thesis Repository', url: 'https://repository.ku.ac.ke', category: 'Research', accessLevel: 'STUDENT' },
  { title: 'Student Handbook 2024', url: '/resources/student-handbook-2024.pdf', category: 'Academic', accessLevel: 'STUDENT' },
  { title: 'Plagiarism Prevention Guide', url: '/resources/plagiarism-guide.pdf', category: 'Academic', accessLevel: 'STUDENT' },
  { title: 'Career Services Portal', url: '/resources/careers', category: 'Career', accessLevel: 'STUDENT' },
  { title: 'Internship Opportunities Database', url: '/resources/internships', category: 'Career', accessLevel: 'STUDENT' },
  { title: 'Financial Aid Application Form', url: '/resources/financial-aid-form.pdf', category: 'Finance', accessLevel: 'STUDENT' },
  { title: 'Research Ethics Guidelines', url: '/resources/research-ethics.pdf', category: 'Research', accessLevel: 'STUDENT' },
  { title: 'Course Catalog 2024-2025', url: '/resources/course-catalog-2024.pdf', category: 'Academic', accessLevel: 'STUDENT' },
  { title: 'Accommodation Booking Guide', url: '/resources/accommodation-guide.pdf', category: 'Hostel', accessLevel: 'STUDENT' },
  { title: 'Health and Safety Handbook', url: '/resources/health-safety.pdf', category: 'General', accessLevel: 'STUDENT' },
  { title: 'Sports and Recreation Guide', url: '/resources/sports-guide.pdf', category: 'General', accessLevel: 'STUDENT' },
  { title: 'Student Governance Handbook', url: '/resources/governance-handbook.pdf', category: 'General', accessLevel: 'STUDENT' },
  { title: 'Digital Literacy Course Materials', url: '/resources/digital-literacy', category: 'Academic', accessLevel: 'STUDENT' },
  { title: 'Campus Map Interactive', url: 'https://map.ku.ac.ke', category: 'General', accessLevel: 'STUDENT' },
  { title: 'Exam Timetable', url: '/resources/exam-timetable.pdf', category: 'Academic', accessLevel: 'STUDENT' },
  { title: 'Staff Directory', url: '/resources/staff-directory', category: 'General', accessLevel: 'STUDENT' },
  { title: 'Alumni Network Portal', url: 'https://alumni.ku.ac.ke', category: 'Career', accessLevel: 'STUDENT' },
];

const HOSTEL_DATA = [
  { name: 'Nairobi Hall', block: 'A', capacity: 200, type: HostelType.MALE },
  { name: 'Kilimanjaro Hall', block: 'B', capacity: 200, type: HostelType.MALE },
  { name: 'Mt Kenya Hall', block: 'A', capacity: 200, type: HostelType.FEMALE },
  { name: 'Rwenzori Hall', block: 'B', capacity: 200, type: HostelType.FEMALE },
];

const MAINTENANCE_ISSUES = [
  'Leaking pipe in bathroom', 'Broken window', 'Electrical socket not working', 'Ceiling fan broken',
  'Bed frame damaged', 'Door lock broken', 'Water heater not functioning', 'Plumbing issue in toilet',
  'Broken desk lamp', 'Curtain rail detached', 'Air conditioning not cooling', 'Mosquito screen torn',
  'Cabinet door broken', 'Shower head malfunction', 'Floor tiles cracked', 'Paint peeling on wall',
];

const LEAVE_REASONS = [
  'Medical leave - hospital admission required', 'Family emergency - urgent travel back home',
  'Attending a national sports competition', 'Personal reasons - mental health break',
  'Financial challenges - need time to secure fees', 'Internship opportunity out of town',
  'Cultural ceremony attendance', 'Maternity leave',
  'Bereavement - loss of immediate family member', 'Religious pilgrimage',
];

const COUNSELLING_REASONS = [
  'Academic stress and anxiety about exams', 'Career path uncertainty',
  'Homesickness and adjustment difficulty', 'Relationship issues',
  'Financial stress affecting mental well-being', 'Sleep difficulties and fatigue',
  'Loss of motivation for studies', 'Peer pressure and social challenges',
  'Post-traumatic stress from family incident', 'General anxiety and depression',
];

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
    description: 'Elect your faculty representative to the university governing council. The representative will argue for better laboratory facilities and research funding.',
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

const ANNOUNCEMENTS = [
  { title: 'Semester Registration Open', content: 'Online registration for the current semester is now open. All students must complete registration by the deadline to avoid late fees. Visit the student portal to register for your courses.', targetRole: Role.STUDENT, priority: 'HIGH' },
  { title: 'Library Extended Hours During Exams', content: 'The university library will operate extended hours (7:00 AM - 10:00 PM) during the examination period. Weekend hours remain unchanged.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'New Scholarships Available', content: 'The Financial Aid Office announces the availability of new scholarship opportunities for continuing students. Applications are due by the end of the month.', targetRole: Role.STUDENT, priority: 'HIGH' },
  { title: 'Career Fair 2026', content: 'The annual Career Fair will be held on March 15th at the Graduation Square. Over 50 companies will be participating. Bring your CV and dress professionally.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'Hostel Allocation for New Students', content: 'Hostel allocation for continuing students is now open. Apply through the student portal. Priority will be given to continuing students.', targetRole: Role.STUDENT, priority: 'HIGH' },
  { title: 'Student Council Elections Notice', content: 'Nominations for the Student Council elections are now open. Pick up nomination forms from the Dean of Students office. Deadline is Friday.', targetRole: Role.STUDENT, priority: 'HIGH' },
  { title: 'Maintenance Work on Campus Network', content: 'Planned network maintenance will occur this Saturday from midnight to 6 AM. Internet access may be intermittent during this period.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'Health Awareness Campaign', content: 'The University Health Services is conducting a month-long health awareness campaign. Free health screenings available at the Health Center.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'Science Faculty Research Symposium', content: 'The Faculty of Science invites all students to the Annual Research Symposium. Selected students will present their research projects.', targetRole: Role.STUDENT, targetFaculty: 'Faculty of Science', priority: 'NORMAL' },
  { title: 'Engineering Week Celebrations', content: 'The Faculty of Engineering presents Engineering Week featuring guest lectures, project exhibitions, and networking sessions with industry leaders.', targetRole: Role.STUDENT, targetFaculty: 'Faculty of Engineering', priority: 'NORMAL' },
  { title: 'Arts Festival 2026', content: 'The Faculty of Arts invites all to the Annual Arts Festival. Featuring drama performances, art exhibitions, poetry readings, and musical concerts.', targetRole: Role.STUDENT, targetFaculty: 'Faculty of Arts', priority: 'NORMAL' },
  { title: 'Computer Science Hackathon', content: 'The Department of Computer Science is organizing a 48-hour hackathon. Teams of 3-4 students. Prizes for the top three projects.', targetRole: Role.STUDENT, targetFaculty: 'Faculty of Science', targetDepartment: 'Department of Computer Science', priority: 'NORMAL' },
  { title: 'Staff Training on New Portal System', content: 'All academic staff are required to attend a training session on the new student portal system. Sessions will be held in the IT lab.', targetRole: Role.STAFF, priority: 'HIGH' },
  { title: 'Semester Exam Timetable Published', content: 'The examination timetable for the current semester has been published. Check your student portal for personalized exam schedules.', targetRole: Role.STUDENT, priority: 'HIGH' },
  { title: 'Campus Security Advisory', content: 'All students are advised to register their personal belongings with campus security. Increased patrols during evening hours.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'Volunteer Opportunities Available', content: 'The Community Outreach Office has volunteer positions available in local schools and community centers. Sign up at the outreach office.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'Graduation Ceremony 2026', content: 'The 40th Graduation Ceremony will be held on December 12th. Graduands should confirm their details on the portal.', targetRole: Role.STUDENT, priority: 'HIGH' },
  { title: 'Course Evaluation Reminder', content: 'Please complete your course evaluations for last semester. Your feedback helps improve the quality of instruction.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'Mental Health Awareness Week', content: 'The Counseling Department presents Mental Health Awareness Week. Group sessions, one-on-one counseling, and wellness activities available.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'Sports Day Announcement', content: 'Annual Sports Day is scheduled for next month. Register your participation through the Sports Department by Friday.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'Tuition Payment Deadline Extension', content: 'The Finance Office announces a two-week extension for tuition payment. Late payment penalties will apply after the extended deadline.', targetRole: Role.STUDENT, priority: 'HIGH' },
  { title: 'New Course Offerings for Next Semester', content: 'The Academic Office has approved new elective courses for the upcoming semester. Check the course catalog on the portal.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'System Maintenance Tonight', content: 'The student portal will be down for maintenance tonight from 2 AM to 5 AM. Plan your activities accordingly.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'Internship Placement Program', content: 'Apply for the semester internship program. Partner companies include Safaricom, KCB, EABL, and Microsoft.', targetRole: Role.STUDENT, priority: 'HIGH' },
  { title: 'Faculty Board Meeting Minutes', content: 'The minutes from the last Faculty Board meeting are now available on the portal for review by all staff.', targetRole: Role.STAFF, priority: 'NORMAL' },
  { title: 'Research Grant Applications Open', content: 'The Research Office invites applications for internal research grants. Both staff and graduate students may apply.', targetRole: Role.STAFF, priority: 'HIGH' },
  { title: 'Campus Clean-Up Exercise', content: 'All students are required to participate in the campus clean-up exercise this Saturday. Departments will be assigned specific areas.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'Exchange Program Applications', content: 'Applications for the student exchange program with partner universities in Europe and Asia are now open.', targetRole: Role.STUDENT, priority: 'HIGH' },
  { title: 'Emergency Drill Notice', content: 'A mandatory emergency evacuation drill will be conducted on Thursday. Follow instructions from your lecturers and security personnel.', targetRole: Role.STUDENT, priority: 'NORMAL' },
  { title: 'End of Semester Arrangements', content: 'Information about end of semester procedures including grade release, transcript requests, and re-registration for continuing students.', targetRole: Role.STUDENT, priority: 'NORMAL' },
];

const STAFF_FIRST_NAMES = ['James', 'Mary', 'Robert', 'Elizabeth', 'Michael', 'Susan', 'William', 'Margaret', 'David', 'Mercy'];
const STAFF_LAST_NAMES = ['Mutua', 'Wanjiku', 'Kamau', 'Njeri', 'Ochieng', 'Chemutai', 'Mwangi', 'Nyambura', 'Kiprop', 'Achieng'];
const STAFF_POSITIONS = ['Lecturer', 'Senior Lecturer', 'Associate Professor', 'Professor', 'Dean', 'HOD', 'Administrator'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomChoices<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomSubset<T>(arr: T[], minCount: number, maxCount: number): T[] {
  const count = randomInt(minCount, maxCount);
  return randomChoices(arr, count);
}

function padNumber(num: number, digits: number): string {
  return String(num).padStart(digits, '0');
}

function generateAdmissionNumber(index: number): string {
  return `P100/${padNumber(index, 4)}/2023`;
}

function generatePhone(): string {
  const prefixes = ['0701', '0711', '0722', '0733', '0740', '0756', '0768', '0771', '0789', '0798', '0110', '0111'];
  const prefix = randomChoice(prefixes);
  const suffix = padNumber(randomInt(0, 999999), 6);
  return `${prefix}${suffix}`;
}

function generateNationalId(): string {
  return padNumber(randomInt(10000000, 99999999), 8);
}

function generateEmail(firstName: string, lastName: string): string {
  const initial = firstName[0].toLowerCase();
  const surname = lastName.toLowerCase();
  return `${initial}.${surname}@students.ku.ac.ke`;
}

function generateStaffEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ku.ac.ke`;
}

function randomGrade(): string {
  const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
  const weights = [0.08, 0.10, 0.15, 0.18, 0.14, 0.12, 0.10, 0.05, 0.04, 0.03, 0.01];
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < grades.length; i++) {
    cumulative += weights[i];
    if (r <= cumulative) return grades[i];
  }
  return 'B';
}

function gradeToPoints(grade: string): number {
  const map: Record<string, number> = {
    'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0,
  };
  return map[grade] ?? 0;
}

function calculateGPA(grades: string[], credits: number[]): number {
  if (grades.length === 0) return 0;
  const totalPoints = grades.reduce((sum, g, i) => sum + gradeToPoints(g) * (credits[i] || 3), 0);
  const totalCredits = credits.reduce((sum, c) => sum + c, 0);
  return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
}

function randomDate(start: Date, end: Date): Date {
  const diff = end.getTime() - start.getTime();
  return new Date(start.getTime() + Math.random() * diff);
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ────────────────────────────────────────────
// Main Seed Function
// ────────────────────────────────────────────

async function main() {
  console.log('Seeding KU Demo Portal database...');
  const startTime = Date.now();

  // ── 1. Clean existing data ──
  console.log('Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.integrationLog.deleteMany();
  await prisma.integrationConfig.deleteMany();
  await prisma.voteRecord.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.electionPermission.deleteMany();
  await prisma.election.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.counsellingRequest.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.disciplinaryRecord.deleteMany();
  await prisma.clearance.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.defermentRequest.deleteMany();
  await prisma.leaveApplication.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hostel.deleteMany();
  await prisma.digitalResource.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.borrowRecord.deleteMany();
  await prisma.book.deleteMany();
  await prisma.feeStatement.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.transcript.deleteMany();
  await prisma.academicRecord.deleteMany();
  await prisma.examCard.deleteMany();
  await prisma.studentCourse.deleteMany();
  await prisma.course.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.department.deleteMany();
  await prisma.school.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  console.log('  Cleaned all existing data.');

  // ── 2. Create Users ──
  console.log('Creating users...');

  const passwordHash = await bcrypt.hash('password123', 12);
  const adminHash = await bcrypt.hash('admin123', 12);
  const staffHash = await bcrypt.hash('staff123', 12);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@ku.ac.ke',
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      username: 'staff1',
      email: 'staff1@ku.ac.ke',
      passwordHash: staffHash,
      role: Role.STAFF,
    },
  });

  const demoStudentUser = await prisma.user.create({
    data: {
      username: 'P100/1234/2023',
      email: 'j.wanjiku@students.ku.ac.ke',
      passwordHash,
      role: Role.STUDENT,
    },
  });

  // Create staff users for appointments
  const staffUsers: { id: string; firstName: string; lastName: string }[] = [];
  for (let i = 0; i < 8; i++) {
    const firstName = STAFF_FIRST_NAMES[i];
    const lastName = STAFF_LAST_NAMES[i];
    const staff = await prisma.user.create({
      data: {
        username: `staff${i + 2}`,
        email: generateStaffEmail(firstName, lastName),
        passwordHash: staffHash,
        role: Role.STAFF,
      },
    });
    staffUsers.push({ id: staff.id, firstName, lastName });
  }

  console.log(`  Created ${9 + staffUsers.length} users.`);

  // ── 3. Create Structural Data ──
  console.log('Creating structural data...');

  // Faculties
  const facultyScience = await prisma.faculty.create({ data: { name: 'Faculty of Science', code: 'SCI' } });
  const facultyArts = await prisma.faculty.create({ data: { name: 'Faculty of Arts', code: 'ART' } });
  const facultyEngineering = await prisma.faculty.create({ data: { name: 'Faculty of Engineering', code: 'ENG' } });
  const faculties = [facultyScience, facultyArts, facultyEngineering];
  console.log(`  Created ${faculties.length} faculties.`);

  // Schools
  const schoolsData = [
    { name: 'School of Computing and Informatics', code: 'SCI-COMP', facultyId: facultyScience.id },
    { name: 'School of Pure and Applied Sciences', code: 'SCI-PURE', facultyId: facultyScience.id },
    { name: 'School of Mathematics and Statistics', code: 'SCI-MATH', facultyId: facultyScience.id },
    { name: 'School of Humanities and Social Sciences', code: 'ART-HUM', facultyId: facultyArts.id },
    { name: 'School of Creative and Performing Arts', code: 'ART-CREA', facultyId: facultyArts.id },
    { name: 'School of Languages and Linguistics', code: 'ART-LANG', facultyId: facultyArts.id },
    { name: 'School of Civil and Mechanical Engineering', code: 'ENG-CIV', facultyId: facultyEngineering.id },
    { name: 'School of Electrical and Information Engineering', code: 'ENG-ELEC', facultyId: facultyEngineering.id },
  ];
  const schools = [];
  for (const s of schoolsData) {
    schools.push(await prisma.school.create({ data: s }));
  }
  console.log(`  Created ${schools.length} schools.`);

  // Departments
  const deptsData = [
    { name: 'Department of Computer Science', code: 'CS', schoolId: schools[0].id },
    { name: 'Department of Information Technology', code: 'IT', schoolId: schools[0].id },
    { name: 'Department of Biology', code: 'BIO', schoolId: schools[1].id },
    { name: 'Department of Chemistry', code: 'CHE', schoolId: schools[1].id },
    { name: 'Department of Physics', code: 'PHY', schoolId: schools[1].id },
    { name: 'Department of Mathematics', code: 'MAT', schoolId: schools[2].id },
    { name: 'Department of Statistics', code: 'STA', schoolId: schools[2].id },
    { name: 'Department of History and Archaeology', code: 'HIS', schoolId: schools[3].id },
    { name: 'Department of Geography', code: 'GEO', schoolId: schools[3].id },
    { name: 'Department of Fine Art and Design', code: 'ART', schoolId: schools[4].id },
    { name: 'Department of Music and Theatre', code: 'MUS', schoolId: schools[4].id },
    { name: 'Department of English and Linguistics', code: 'ENG-L', schoolId: schools[5].id },
    { name: 'Department of Civil Engineering', code: 'CIV', schoolId: schools[6].id },
    { name: 'Department of Mechanical Engineering', code: 'MEC', schoolId: schools[6].id },
    { name: 'Department of Electrical Engineering', code: 'ELE', schoolId: schools[7].id },
  ];
  const departments = [];
  for (const d of deptsData) {
    departments.push(await prisma.department.create({ data: d }));
  }
  console.log(`  Created ${departments.length} departments.`);

  // Programmes
  const programmesData = [
    { name: 'BSc Computer Science', code: 'BSC-CS', departmentId: departments.find(d => d.name === 'Department of Computer Science')!.id, durationYears: 4 },
    { name: 'BSc Information Technology', code: 'BSC-IT', departmentId: departments.find(d => d.name === 'Department of Information Technology')!.id, durationYears: 4 },
    { name: 'BSc Biology', code: 'BSC-BIO', departmentId: departments.find(d => d.name === 'Department of Biology')!.id, durationYears: 4 },
    { name: 'BSc Chemistry', code: 'BSC-CHE', departmentId: departments.find(d => d.name === 'Department of Chemistry')!.id, durationYears: 4 },
    { name: 'BSc Physics', code: 'BSC-PHY', departmentId: departments.find(d => d.name === 'Department of Physics')!.id, durationYears: 4 },
    { name: 'BSc Mathematics', code: 'BSC-MAT', departmentId: departments.find(d => d.name === 'Department of Mathematics')!.id, durationYears: 4 },
    { name: 'BSc Statistics', code: 'BSC-STA', departmentId: departments.find(d => d.name === 'Department of Statistics')!.id, durationYears: 4 },
    { name: 'BA History', code: 'BA-HIS', departmentId: departments.find(d => d.name === 'Department of History and Archaeology')!.id, durationYears: 4 },
    { name: 'BA Geography', code: 'BA-GEO', departmentId: departments.find(d => d.name === 'Department of Geography')!.id, durationYears: 4 },
    { name: 'BA Fine Art', code: 'BA-ART', departmentId: departments.find(d => d.name === 'Department of Fine Art and Design')!.id, durationYears: 4 },
    { name: 'BA Music and Theatre', code: 'BA-MUS', departmentId: departments.find(d => d.name === 'Department of Music and Theatre')!.id, durationYears: 4 },
    { name: 'BA English and Linguistics', code: 'BA-ENG', departmentId: departments.find(d => d.name === 'Department of English and Linguistics')!.id, durationYears: 4 },
    { name: 'BSc Civil Engineering', code: 'BSC-CIV', departmentId: departments.find(d => d.name === 'Department of Civil Engineering')!.id, durationYears: 5 },
    { name: 'BSc Mechanical Engineering', code: 'BSC-MEC', departmentId: departments.find(d => d.name === 'Department of Mechanical Engineering')!.id, durationYears: 5 },
    { name: 'BSc Electrical Engineering', code: 'BSC-ELE', departmentId: departments.find(d => d.name === 'Department of Electrical Engineering')!.id, durationYears: 5 },
    { name: 'BSc Computer Engineering', code: 'BSC-CE', departmentId: departments.find(d => d.name === 'Department of Computer Science')!.id, durationYears: 5 },
    { name: 'BA Economics', code: 'BA-ECON', departmentId: departments.find(d => d.name === 'Department of History and Archaeology')!.id, durationYears: 4 },
    { name: 'BSc Telecommunication Engineering', code: 'BSC-TEL', departmentId: departments.find(d => d.name === 'Department of Electrical Engineering')!.id, durationYears: 5 },
    { name: 'BSc Software Engineering', code: 'BSC-SE', departmentId: departments.find(d => d.name === 'Department of Information Technology')!.id, durationYears: 4 },
    { name: 'BSc Applied Statistics', code: 'BSC-ASTA', departmentId: departments.find(d => d.name === 'Department of Statistics')!.id, durationYears: 4 },
  ];
  const programmes = [];
  for (const p of programmesData) {
    programmes.push(await prisma.programme.create({ data: p }));
  }
  console.log(`  Created ${programmes.length} programmes.`);

  // Semesters
  const semestersData = [
    { name: 'Year 1 Semester 1', year: 2023, startDate: new Date('2023-09-01'), endDate: new Date('2023-12-15'), isCurrent: false, registrationOpen: false },
    { name: 'Year 1 Semester 2', year: 2024, startDate: new Date('2024-01-08'), endDate: new Date('2024-04-30'), isCurrent: false, registrationOpen: false },
    { name: 'Year 2 Semester 1', year: 2024, startDate: new Date('2024-09-01'), endDate: new Date('2024-12-15'), isCurrent: false, registrationOpen: false },
    { name: 'Year 2 Semester 2', year: 2025, startDate: new Date('2025-01-08'), endDate: new Date('2025-04-30'), isCurrent: false, registrationOpen: false },
    { name: 'Year 3 Semester 1', year: 2025, startDate: new Date('2025-09-01'), endDate: new Date('2025-12-15'), isCurrent: false, registrationOpen: false },
    { name: 'Year 3 Semester 2', year: 2026, startDate: new Date('2026-01-08'), endDate: new Date('2026-04-30'), isCurrent: false, registrationOpen: false },
    { name: 'Year 4 Semester 1', year: 2026, startDate: new Date('2026-09-01'), endDate: new Date('2026-12-15'), isCurrent: true, registrationOpen: true },
  ];
  const semesters = [];
  for (const s of semestersData) {
    semesters.push(await prisma.semester.create({ data: s }));
  }
  console.log(`  Created ${semesters.length} semesters.`);

  // Courses — 200 courses
  const courseNamesByCode = COURSE_NAMES_BY_CODE;
  const allCourseCodes = ['CS', 'IT', 'BIO', 'CHE', 'PHY', 'MAT', 'STA', 'HIS', 'GEO', 'ART', 'MUS', 'ENG-L', 'CIV', 'MEC', 'ELE'];

  const courseCodeCounters: Record<string, number> = {};
  const courses = [];

  // Map department names to their department IDs
  const deptMap: Record<string, string> = {};
  for (const d of departments) {
    deptMap[d.name] = d.id;
  }

  for (let i = 0; i < 200; i++) {
    const dept = departments[i % departments.length];
    const deptCode = allCourseCodes[i % allCourseCodes.length];
    if (!courseCodeCounters[deptCode]) courseCodeCounters[deptCode] = 1;
    const counter = courseCodeCounters[deptCode];
    courseCodeCounters[deptCode] = counter + 1;

    const namesPool = courseNamesByCode[deptCode] || ['General Course'];
    const courseIndex = (i % namesPool.length);

    const year = Math.min(4, Math.ceil((i + 1) / 50));
    const sem = ((i % 2) === 0) ? 1 : 2;

    const course = await prisma.course.create({
      data: {
        code: `${deptCode}${padNumber(counter, 3)}`,
        name: namesPool[courseIndex],
        credits: randomChoice([2, 3, 3, 3, 4, 4]),
        semester: sem,
        year: year,
        isActive: true,
        departmentId: dept.id,
      },
    });
    courses.push(course);
  }
  console.log(`  Created ${courses.length} courses.`);

  // ── 4. Create Students ──
  console.log('Creating 1000 students...');

  const studentIds: string[] = [];

  // Students 1-1000 (index 0-999). Demo student is index 33 (P100/1234/2023)
  for (let i = 0; i < 1000; i++) {
    const admissionNumber = generateAdmissionNumber(i + 1);
    const firstName = randomChoice(KENYAN_FIRST_NAMES);
    const lastName = randomChoice(KENYAN_LAST_NAMES);
    const feeStatuses: FeeStatus[] = [FeeStatus.CLEAR, FeeStatus.PARTIAL, FeeStatus.OUTSTANDING];
    const feeWeights = [0.6, 0.25, 0.15]; // mostly clear
    const feeR = Math.random();
    let feeStatus: FeeStatus = FeeStatus.CLEAR;
    let cum = 0;
    for (let fi = 0; fi < feeStatuses.length; fi++) {
      cum += feeWeights[fi];
      if (feeR <= cum) { feeStatus = feeStatuses[fi]; break; }
    }

    const yearOfStudy = randomInt(1, 4);
    const currentSemester = randomInt(1, 2);
    const enrollmentStatuses: EnrollmentStatus[] = [EnrollmentStatus.ACTIVE, EnrollmentStatus.DEFERRED, EnrollmentStatus.SUSPENDED, EnrollmentStatus.GRADUATED, EnrollmentStatus.WITHDRAWN];
    const enrollmentR = Math.random();
    let enrollmentStatus: EnrollmentStatus = EnrollmentStatus.ACTIVE;
    if (enrollmentR < 0.02) enrollmentStatus = EnrollmentStatus.DEFERRED;
    else if (enrollmentR < 0.035) enrollmentStatus = EnrollmentStatus.SUSPENDED;
    else if (enrollmentR < 0.05 && yearOfStudy >= 4) enrollmentStatus = EnrollmentStatus.GRADUATED;
    else if (enrollmentR < 0.06) enrollmentStatus = EnrollmentStatus.WITHDRAWN;

    const faculty = randomChoice(faculties);
    const school = randomChoice(schools.filter(s => s.facultyId === faculty.id));
    const dept = departments.filter(d => d.schoolId === school.id);
    const deptChoice = dept.length > 0 ? randomChoice(dept) : departments[0];
    const prog = programmes.filter(p => p.departmentId === deptChoice.id);
    const progChoice = prog.length > 0 ? randomChoice(prog) : programmes[0];

    const isDemoStudent = (admissionNumber === 'P100/1234/2023');

    const user = await prisma.user.create({
      data: {
        username: admissionNumber,
        email: isDemoStudent ? 'j.wanjiku@students.ku.ac.ke' : generateEmail(firstName, lastName),
        passwordHash: isDemoStudent ? passwordHash : await bcrypt.hash('password123', 8),
        role: Role.STUDENT,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        admissionNumber,
        firstName: isDemoStudent ? 'Jane' : firstName,
        lastName: isDemoStudent ? 'Wanjiku' : lastName,
        nationalId: isDemoStudent ? '12345678' : generateNationalId(),
        phone: generatePhone(),
        email: isDemoStudent ? 'j.wanjiku@students.ku.ac.ke' : generateEmail(firstName, lastName),
        emergencyContact: generatePhone(),
        yearOfStudy: isDemoStudent ? 4 : yearOfStudy,
        currentSemester: isDemoStudent ? 1 : currentSemester,
        feeStatus,
        enrollmentStatus,
        facultyId: isDemoStudent ? facultyScience.id : faculty.id,
        schoolId: isDemoStudent ? schools[0].id : school.id,
        departmentId: isDemoStudent ? deptMap['Department of Computer Science'] : deptChoice.id,
        programmeId: isDemoStudent ? programmes[0].id : progChoice.id,
      },
    });

    studentIds.push(student.id);

    if (i % 100 === 0) {
      console.log(`  Created ${i + 1} students...`);
    }
  }
  console.log('  Created 1000 students.');

  // Get demo student
  const demoStudent = await prisma.student.findUnique({
    where: { admissionNumber: 'P100/1234/2023' },
  });
  const demoStudentId = demoStudent!.id;

  // ── 5. Student Courses & Academic Records ──
  console.log('Creating student course registrations and academic records...');

  let courseCount = 0;
  for (const studentId of studentIds) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) continue;

    const isDemo = studentId === demoStudentId;
    const maxYear = student.yearOfStudy;
    const totalCompleteSemesters = isDemo ? 6 : Math.max(0, (maxYear - 1) * 2 + (student.currentSemester - 1));
    const currentSemIdx = totalCompleteSemesters; // index of current semester in semesters array

    for (let semIdx = 0; semIdx < Math.min(totalCompleteSemesters, semesters.length); semIdx++) {
      const semester = semesters[semIdx];
      const yearForSem = Math.floor(semIdx / 2) + 1;
      const semesterInYear = (semIdx % 2) + 1;

      // Find courses appropriate for this year and semester
      const availableCourses = courses.filter(c =>
        c.year === yearForSem && c.semester === semesterInYear && c.isActive
      );
      const numCourses = Math.min(randomInt(5, 7), availableCourses.length);
      const selectedCourses = randomChoices(availableCourses, numCourses);

      for (const course of selectedCourses) {
        const status: CourseStatus = CourseStatus.COMPLETED;
        const grade = randomGrade();
        const marks = grade === 'F' ? randomInt(25, 39) : randomInt(40, 100);
        const attendance = randomInt(70, 100);

        await prisma.studentCourse.create({
          data: {
            studentId,
            courseId: course.id,
            semesterId: semester.id,
            status,
            grade,
            marks,
            attendancePercentage: attendance,
          },
        });
        courseCount++;

        if (isDemo && semIdx >= 4) {
          // Give demo student better grades in later semesters
          // We'll just let it use the random system
        }
      }

      // Create AcademicRecord for this semester
      const completedCourses = selectedCourses.length;
      if (completedCourses > 0) {
        const demoBonus = isDemo ? (semIdx >= 2 ? 0.3 : 0.1) : 0;
        const baseGpa = randomFloat(2.0 + demoBonus, 3.8 + demoBonus);
        // CGPA is progressive
        const prevRecords = await prisma.academicRecord.findMany({
          where: { studentId },
          orderBy: { semesterId: 'asc' },
        });

        let cgpa: number;
        if (prevRecords.length > 0) {
          const prevCgpa = prevRecords[prevRecords.length - 1].cgpa;
          cgpa = parseFloat(((prevCgpa * prevRecords.length + baseGpa) / (prevRecords.length + 1)).toFixed(2));
        } else {
          cgpa = baseGpa;
        }

        const totalCredits = completedCourses * 3;
        await prisma.academicRecord.create({
          data: {
            studentId,
            semesterId: semester.id,
            gpa: baseGpa,
            cgpa,
            totalCredits,
            rank: randomInt(1, 100),
          },
        });
      }
    }

    // Register current semester courses for ACTIVE students with a current semester
    if (student.enrollmentStatus === EnrollmentStatus.ACTIVE && student.yearOfStudy <= 4) {
      const currentSemIdx2 = Math.min(totalCompleteSemesters, semesters.length - 1);
      const currentSemester = semesters.find(s => s.isCurrent) || semesters[currentSemIdx2];
      if (currentSemester) {
        // Find inappropriate courses for current year & sem
        const currentYear = student.yearOfStudy;
        const currentSemInYear = student.currentSemester;
        const availableCourses = courses.filter(c =>
          c.year === currentYear && c.semester === currentSemInYear && c.isActive
        );
        const numCourses = Math.min(randomInt(5, 7), availableCourses.length);
        const selectedCourses = randomChoices(availableCourses, numCourses);

        for (const course of selectedCourses) {
          const status: CourseStatus = CourseStatus.REGISTERED;

          await prisma.studentCourse.create({
            data: {
              studentId,
              courseId: course.id,
              semesterId: currentSemester.id,
              status,
            },
          });
          courseCount++;
        }
      }
    }

    if (courseCount % 2000 === 0) {
      console.log(`  Created ${courseCount} course registrations...`);
    }
  }

  // Create demo student 6th semester academic record if not present
  const demoRecords = await prisma.academicRecord.findMany({
    where: { studentId: demoStudentId },
    orderBy: { semesterId: 'asc' },
  });

  // Ensure demo student has all 6 semester records with good GPAs
  const demoGpas = [3.2, 3.4, 3.5, 3.6, 3.7, 3.8];
  for (let i = 0; i < Math.min(6, semesters.length); i++) {
    const existing = demoRecords.find(r => r.semesterId === semesters[i].id);
    if (!existing) {
      const gpa = demoGpas[i] || 3.5;
      // Calculate cgpa from previous
      const prevRecs = await prisma.academicRecord.findMany({
        where: { studentId: demoStudentId },
        orderBy: { semesterId: 'asc' },
      });
      let cgpa: number;
      if (prevRecs.length > 0) {
        cgpa = parseFloat(((prevRecs[prevRecs.length - 1].cgpa * prevRecs.length + gpa) / (prevRecs.length + 1)).toFixed(2));
      } else {
        cgpa = gpa;
      }
      await prisma.academicRecord.create({
        data: {
          studentId: demoStudentId,
          semesterId: semesters[i].id,
          gpa,
          cgpa,
          totalCredits: 18,
          rank: randomInt(1, 20),
        },
      });
    }
  }

  // Update existing demo records with better GPAs
  for (let i = 0; i < Math.min(6, semesters.length); i++) {
    const existing = demoRecords.find(r => r.semesterId === semesters[i].id);
    if (existing && existing.gpa < demoGpas[i]) {
      await prisma.academicRecord.update({
        where: { id: existing.id },
        data: { gpa: demoGpas[i] },
      });
    }
  }

  // Create demo student exam card for current semester
  const currentSem = semesters.find(s => s.isCurrent) || semesters[6];
  const currentDemosCourses = await prisma.studentCourse.findMany({
    where: { studentId: demoStudentId, semesterId: currentSem.id },
    include: { course: true },
  });

  if (currentDemosCourses.length > 0) {
    await prisma.examCard.create({
      data: {
        studentId: demoStudentId,
        semesterId: currentSem.id,
        courses: currentDemosCourses.map(sc => ({ code: sc.course.code, name: sc.course.name, credits: sc.course.credits })),
        examDates: currentDemosCourses.map((sc, idx) => ({
          code: sc.course.code,
          date: new Date(2026, 11, 1 + idx * 2).toISOString().split('T')[0],
          time: '08:00 AM',
          venue: `Room ${100 + idx}`,
        })),
        venue: 'Examination Centre',
        status: 'ISSUED',
      },
    });
  }

  // Create Transcripts for students with 2+ years
  const transcriptStudents = await prisma.academicRecord.findMany({
    where: { student: { yearOfStudy: { gte: 2 } } },
    distinct: ['studentId'],
    take: 300,
  });

  for (const rec of transcriptStudents) {
    const studentRecs = await prisma.academicRecord.findMany({
      where: { studentId: rec.studentId },
      orderBy: { semesterId: 'asc' },
    });
    if (studentRecs.length === 0) continue;

    const finalCgpa = studentRecs[studentRecs.length - 1].cgpa;
    let classification = 'Pass';
    if (finalCgpa >= 3.6) classification = 'First Class Honours';
    else if (finalCgpa >= 3.0) classification = 'Upper Second Class Honours';
    else if (finalCgpa >= 2.4) classification = 'Lower Second Class Honours';
    else if (finalCgpa >= 2.0) classification = 'Pass';

    const studentCoursesForTranscript = await prisma.studentCourse.findMany({
      where: { studentId: rec.studentId },
      include: { course: true, semester: true },
      orderBy: [{ semester: { year: 'asc' } }, { semester: { startDate: 'asc' } }],
    });

    await prisma.transcript.create({
      data: {
        studentId: rec.studentId,
        courses: studentCoursesForTranscript.slice(0, 40).map(sc => ({
          code: sc.course.code,
          name: sc.course.name,
          credits: sc.course.credits,
          grade: sc.grade,
          semester: sc.semester.name,
        })),
        cumulativeGPA: finalCgpa,
        classification,
      },
    });
  }

  // Create demo transcript
  await prisma.transcript.create({
    data: {
      studentId: demoStudentId,
      courses: currentDemosCourses.map(sc => ({
        code: sc.course.code,
        name: sc.course.name,
        credits: sc.course.credits,
        grade: 'A-',
        semester: currentSem.name,
      })),
      cumulativeGPA: 3.45,
      classification: 'Upper Second Class Honours',
    },
  });

  console.log(`  Created ${courseCount} course registrations.`);
  console.log(`  Created academic records and transcripts.`);

  // ── 6. Finance Data ──
  console.log('Creating finance records...');

  // Create 100 invoices
  const invoiceStatuses: InvoiceStatus[] = [InvoiceStatus.PAID, InvoiceStatus.PENDING, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIAL, InvoiceStatus.CANCELLED];
  const invoiceWeights = [0.35, 0.25, 0.15, 0.15, 0.10];

  for (let i = 0; i < 100; i++) {
    const studentId = randomChoice(studentIds.filter(s => s !== demoStudentId));
    const semester = randomChoice(semesters);

    const invR = Math.random();
    let invStatus: InvoiceStatus = InvoiceStatus.PENDING;
    let cumInv = 0;
    for (let fi = 0; fi < invoiceStatuses.length; fi++) {
      cumInv += invoiceWeights[fi];
      if (invR <= cumInv) { invStatus = invoiceStatuses[fi]; break; }
    }

    const tuitionItems = [
      { description: 'Tuition Fee', amount: randomFloat(35000, 65000) },
      { description: 'Library Fee', amount: randomFloat(2000, 5000) },
      { description: 'Computer Lab Fee', amount: randomFloat(3000, 8000) },
      { description: 'Sports Fee', amount: randomFloat(1000, 3000) },
      { description: 'Medical Fee', amount: randomFloat(2000, 4000) },
      { description: 'Student Union Fee', amount: randomFloat(500, 1500) },
    ];
    const numItems = randomInt(2, 4);
    const selectedItems = randomChoices(tuitionItems, numItems);
    const totalAmount = selectedItems.reduce((sum, item) => sum + item.amount, 0);

    await prisma.invoice.create({
      data: {
        studentId,
        semesterId: semester.id,
        amount: totalAmount,
        dueDate: randomDate(new Date('2025-01-01'), new Date('2026-12-31')),
        status: invStatus,
        items: selectedItems,
      },
    });
  }

  // Demo student invoices
  const demoInvoice1 = await prisma.invoice.create({
    data: {
      studentId: demoStudentId,
      semesterId: semesters[5].id,
      amount: 78000,
      dueDate: new Date('2026-02-15'),
      status: InvoiceStatus.PAID,
      items: [
        { description: 'Tuition Fee', amount: 65000 },
        { description: 'Library Fee', amount: 4000 },
        { description: 'Computer Lab Fee', amount: 5000 },
        { description: 'Student Union Fee', amount: 1000 },
        { description: 'Sports Fee', amount: 1500 },
        { description: 'Medical Fee', amount: 1500 },
      ],
    },
  });

  const demoInvoice2 = await prisma.invoice.create({
    data: {
      studentId: demoStudentId,
      semesterId: currentSem.id,
      amount: 82000,
      dueDate: new Date('2026-10-15'),
      status: InvoiceStatus.PENDING,
      items: [
        { description: 'Tuition Fee', amount: 68000 },
        { description: 'Library Fee', amount: 4500 },
        { description: 'Computer Lab Fee', amount: 5000 },
        { description: 'Student Union Fee', amount: 1000 },
        { description: 'Sports Fee', amount: 1500 },
        { description: 'Medical Fee', amount: 2000 },
      ],
    },
  });

  console.log('  Created invoices.');

  // Create 500 payments
  const paymentMethods = ['MPESA', 'BANK_TRANSFER', 'CHEQUE', 'CASH'];
  for (let i = 0; i < 500; i++) {
    const invoice = await prisma.invoice.findFirst({
      where: { status: { not: InvoiceStatus.CANCELLED } },
      skip: i % 100,
    });
    if (!invoice) continue;

    const payAmount = invoice.status === InvoiceStatus.PAID ? invoice.amount : randomFloat(10000, invoice.amount);
    const payStatus = invoice.status === InvoiceStatus.PAID ? 'COMPLETED' : randomChoice(['COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'FAILED']);

    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        amount: payAmount,
        method: randomChoice(paymentMethods),
        reference: `PAY-${String(Date.now()).slice(-6)}-${padNumber(i + 1, 4)}`,
        status: payStatus,
        paidAt: randomDate(new Date('2025-01-01'), new Date('2026-06-15')),
      },
    });
  }

  // Demo student payments
  await prisma.payment.create({
    data: {
      invoiceId: demoInvoice1.id,
      studentId: demoStudentId,
      amount: 50000,
      method: 'MPESA',
      reference: 'PAY-MPESA-20260201',
      status: 'COMPLETED',
      paidAt: new Date('2026-02-01'),
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: demoInvoice1.id,
      studentId: demoStudentId,
      amount: 18000,
      method: 'BANK_TRANSFER',
      reference: 'PAY-BNK-20260210',
      status: 'COMPLETED',
      paidAt: new Date('2026-02-10'),
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: demoInvoice1.id,
      studentId: demoStudentId,
      amount: 10000,
      method: 'CASH',
      reference: 'PAY-CASH-20260212',
      status: 'COMPLETED',
      paidAt: new Date('2026-02-12'),
    },
  });

  console.log('  Created payments.');

  // Scholarships
  const scholarshipPrograms = [
    { name: 'HELB Loan', provider: 'Higher Education Loans Board', amount: 40000 },
    { name: 'County Bursary', provider: 'County Government', amount: 15000 },
    { name: 'Presidential Scholarship', provider: 'Government of Kenya', amount: 60000 },
    { name: 'Equity Bank Scholarship', provider: 'Equity Bank Foundation', amount: 50000 },
    { name: 'Safaricom Foundation', provider: 'Safaricom PLC', amount: 45000 },
    { name: 'Minority Support Fund', provider: 'KU Endowment', amount: 20000 },
    { name: 'Sports Bursary', provider: 'Ministry of Sports', amount: 25000 },
    { name: 'Women in STEM', provider: 'UNESCO', amount: 55000 },
    { name: 'Dean\'s Merit Award', provider: 'KU Faculty Board', amount: 30000 },
    { name: 'Need-Based Grant', provider: 'KU Financial Aid', amount: 35000 },
  ];

  for (let i = 0; i < 30; i++) {
    const studentId = randomChoice(studentIds);
    const sch = randomChoice(scholarshipPrograms);
    const startYear = randomInt(2023, 2025);

    await prisma.scholarship.create({
      data: {
        studentId,
        name: sch.name,
        amount: sch.amount,
        provider: sch.provider,
        startDate: new Date(`${startYear}-09-01`),
        endDate: new Date(`${startYear + 1}-08-31`),
        status: randomChoice(['ACTIVE', 'ACTIVE', 'ACTIVE', 'EXPIRED', 'SUSPENDED']),
      },
    });
  }

  // Demo student scholarship (HELB)
  await prisma.scholarship.create({
    data: {
      studentId: demoStudentId,
      name: 'HELB Loan',
      amount: 40000,
      provider: 'Higher Education Loans Board',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2027-08-31'),
      status: 'ACTIVE',
    },
  });

  // Fee statements
  const feeStudents = randomChoices(studentIds, 50);
  for (const studentId of feeStudents) {
    const sem = randomChoice(semesters);
    const charges = randomFloat(60000, 120000);
    const payments = randomFloat(0, charges);
    const balance = charges - payments;

    await prisma.feeStatement.create({
      data: {
        studentId,
        semesterId: sem.id,
        totalCharges: charges,
        totalPayments: payments,
        balance,
      },
    });
  }

  // Demo student fee statement
  await prisma.feeStatement.create({
    data: {
      studentId: demoStudentId,
      semesterId: currentSem.id,
      totalCharges: 82000,
      totalPayments: 30000,
      balance: 52000,
    },
  });

  console.log('  Created scholarships and fee statements.');

  // ── 7. Library Data ──
  console.log('Creating library records...');

  // Books
  const createdBooks = [];
  for (const book of BOOKS_DATA) {
    const copies = randomInt(2, 8);
    const available = Math.max(0, copies - randomInt(0, Math.min(copies, 3)));
    const b = await prisma.book.create({
      data: {
        ...book,
        totalCopies: copies,
        availableCopies: available,
      },
    });
    createdBooks.push(b);
  }
  console.log(`  Created ${createdBooks.length} books.`);

  // Borrow records
  for (let i = 0; i < 200; i++) {
    const studentId = randomChoice(studentIds);
    const book = randomChoice(createdBooks);
    const borrowedAt = randomDate(new Date('2025-01-01'), new Date('2026-06-15'));
    const dueDate = new Date(borrowedAt);
    dueDate.setDate(dueDate.getDate() + randomInt(14, 30));

    const statusR = Math.random();
    let status: BorrowStatus;
    let returnedAt: Date | null = null;
    let fine = 0;

    if (statusR < 0.45) {
      status = BorrowStatus.RETURNED;
      returnedAt = new Date(dueDate);
      returnedAt.setDate(returnedAt.getDate() + randomInt(-5, 5));
      if (returnedAt > dueDate) {
        const daysOverdue = Math.floor((returnedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        fine = daysOverdue * 20;
      }
    } else if (statusR < 0.75) {
      status = BorrowStatus.BORROWED;
      dueDate.setDate(dueDate.getDate() + randomInt(-5, 5)); // some due soon
    } else if (statusR < 0.90) {
      status = BorrowStatus.OVERDUE;
      dueDate.setDate(dueDate.getDate() - randomInt(5, 30)); // overdue
      fine = randomInt(5, 30) * 20;
    } else {
      status = BorrowStatus.LOST;
      fine = 500;
    }

    await prisma.borrowRecord.create({
      data: {
        studentId,
        bookId: book.id,
        borrowedAt,
        dueDate,
        returnedAt,
        fine,
        status,
      },
    });
  }

  // Demo student borrow records
  const demoBook1 = createdBooks[0]; // The C Programming Language
  const demoBook2 = createdBooks[2]; // JavaScript: The Good Parts

  await prisma.borrowRecord.create({
    data: {
      studentId: demoStudentId,
      bookId: demoBook1.id,
      borrowedAt: new Date('2026-05-20'),
      dueDate: daysFromNow(7), // due soon
      status: BorrowStatus.BORROWED,
    },
  });

  await prisma.borrowRecord.create({
    data: {
      studentId: demoStudentId,
      bookId: demoBook2.id,
      borrowedAt: new Date('2026-04-15'),
      dueDate: daysFromNow(-20), // overdue
      fine: 300,
      status: BorrowStatus.OVERDUE,
    },
  });

  console.log('  Created borrow records.');

  // Reservations
  for (let i = 0; i < 30; i++) {
    const studentId = randomChoice(studentIds);
    const book = randomChoice(createdBooks);

    await prisma.reservation.create({
      data: {
        studentId,
        bookId: book.id,
        reservedAt: randomDate(new Date('2026-01-01'), new Date('2026-06-15')),
        expiresAt: randomDate(new Date('2026-06-20'), new Date('2026-08-01')),
        status: randomChoice(['ACTIVE', 'ACTIVE', 'ACTIVE', 'FULFILLED', 'CANCELLED']),
      },
    });
  }

  // Demo student reservations
  const demoBook3 = createdBooks[4]; // The Art of Computer Programming
  await prisma.reservation.create({
    data: {
      studentId: demoStudentId,
      bookId: demoBook3.id,
      reservedAt: new Date('2026-06-20'),
      expiresAt: daysFromNow(30),
      status: 'ACTIVE',
    },
  });

  const demoBook4 = createdBooks[10]; // AI: A Modern Approach
  await prisma.reservation.create({
    data: {
      studentId: demoStudentId,
      bookId: demoBook4.id,
      reservedAt: new Date('2026-06-25'),
      expiresAt: daysFromNow(35),
      status: 'ACTIVE',
    },
  });

  // Digital resources
  for (const resource of DIGITAL_RESOURCES) {
    await prisma.digitalResource.create({ data: resource });
  }
  console.log('  Created digital resources.');

  // ── 8. Hostel Data ──
  console.log('Creating hostel records...');

  const createdHostels = [];
  for (const hData of HOSTEL_DATA) {
    const hostel = await prisma.hostel.create({ data: hData });
    createdHostels.push(hostel);
  }
  console.log(`  Created ${createdHostels.length} hostels.`);

  // Rooms — 25 per hostel
  const createdRooms: { id: string; hostelId: string }[] = [];
  for (const hostel of createdHostels) {
    for (let r = 1; r <= 25; r++) {
      const roomNumber = `${hostel.block}${padNumber(r, 2)}`;
      const capacity = randomChoice([2, 4, 4, 4, 6]);
      const room = await prisma.room.create({
        data: {
          hostelId: hostel.id,
          number: roomNumber,
          capacity,
          occupiedBeds: 0,
          type: capacity === 2 ? 'MINI' : capacity >= 6 ? 'DORMITORY' : 'SHARED',
        },
      });
      createdRooms.push(room);
    }
  }
  console.log(`  Created ${createdRooms.length} rooms.`);

  // Allocations — 300 students
  const allocStudents = randomChoices(studentIds, 300);
  let allocIndex = 0;
  const roomOccupancy: Record<string, number> = {};

  for (const hostel of createdHostels) {
    const hostelRooms = createdRooms.filter(r => r.hostelId === hostel.id);
    for (const room of hostelRooms) {
      roomOccupancy[room.id] = 0;
    }
  }

  // Demo student allocation to male hostel
  const maleHostel = createdHostels[0];
  const maleRooms = createdRooms.filter(r => r.hostelId === maleHostel.id);
  const demoRoom = maleRooms[5]; // Room A06

  // Allocate 4 students to demo student's room
  const roommates = allocStudents.slice(0, 3);
  const demoAllocStudents = [demoStudentId, ...roommates];

  for (let bi = 0; bi < demoAllocStudents.length; bi++) {
    const sid = demoAllocStudents[bi];
    await prisma.allocation.create({
      data: {
        studentId: sid,
        roomId: demoRoom.id,
        bedNumber: bi + 1,
        allocatedAt: new Date('2026-01-08'),
        status: 'ACTIVE',
      },
    });
    roomOccupancy[demoRoom.id] = (roomOccupancy[demoRoom.id] || 0) + 1;
  }

  await prisma.room.update({
    where: { id: demoRoom.id },
    data: { occupiedBeds: demoAllocStudents.length },
  });

  // Allocate remaining students
  const remainingAllocStudents = allocStudents.slice(3);
  for (const studentId of remainingAllocStudents) {
    // Find a room with space
    const studentRecord = await prisma.student.findUnique({ where: { id: studentId } });
    const hostelType = studentRecord?.firstName ? randomChoice(['MALE', 'FEMALE']) : 'MIXED';
    let hostelPool = createdHostels;
    if (hostelType === 'MALE') hostelPool = createdHostels.filter(h => h.type === HostelType.MALE);
    else if (hostelType === 'FEMALE') hostelPool = createdHostels.filter(h => h.type === HostelType.FEMALE);
    const hostel = randomChoice(hostelPool);
    const hostelRooms = createdRooms.filter(r => r.hostelId === hostel.id);

    // Find a room with available space
    let assigned = false;
    for (const room of hostelRooms) {
      const occupancy = roomOccupancy[room.id] || 0;
      const roomData = await prisma.room.findUnique({ where: { id: room.id } });
      if (roomData && occupancy < roomData.capacity) {
        await prisma.allocation.create({
          data: {
            studentId,
            roomId: room.id,
            bedNumber: occupancy + 1,
            allocatedAt: randomDate(new Date('2026-01-08'), new Date('2026-02-01')),
            status: 'ACTIVE',
          },
        });
        roomOccupancy[room.id] = occupancy + 1;
        assigned = true;
        break;
      }
    }
    if (!assigned) continue;
  }

  // Update room occupancy counts
  for (const [roomId, count] of Object.entries(roomOccupancy)) {
    if (count > 0) {
      await prisma.room.update({
        where: { id: roomId },
        data: { occupiedBeds: count },
      });
    }
  }

  console.log('  Created hostel allocations.');

  // Maintenance requests — 50
  for (let i = 0; i < 50; i++) {
    const studentId = randomChoice(studentIds);
    const alloc = await prisma.allocation.findFirst({ where: { studentId } });
    if (!alloc) continue;

    const statusR = Math.random();
    let reqStatus: string;
    let resolvedAt: Date | null = null;
    if (statusR < 0.4) { reqStatus = 'PENDING'; }
    else if (statusR < 0.65) { reqStatus = 'IN_PROGRESS'; }
    else if (statusR < 0.9) { reqStatus = 'RESOLVED'; resolvedAt = randomDate(new Date('2026-01-01'), new Date('2026-06-15')); }
    else { reqStatus = 'CANCELLED'; }

    await prisma.maintenanceRequest.create({
      data: {
        studentId,
        roomId: alloc.roomId,
        issue: randomChoice(MAINTENANCE_ISSUES),
        priority: randomChoice(['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH', 'URGENT']),
        status: reqStatus,
        createdAt: randomDate(new Date('2025-09-01'), new Date('2026-06-15')),
        resolvedAt,
      },
    });
  }

  // Demo student maintenance request
  const demoAlloc = await prisma.allocation.findUnique({ where: { studentId: demoStudentId } });
  if (demoAlloc) {
    await prisma.maintenanceRequest.create({
      data: {
        studentId: demoStudentId,
        roomId: demoAlloc.roomId,
        issue: 'Leaking pipe in bathroom sink causing water damage to the floor',
        priority: 'HIGH',
        status: 'PENDING',
        createdAt: daysFromNow(-5),
      },
    });

    // One past resolved request
    await prisma.maintenanceRequest.create({
      data: {
        studentId: demoStudentId,
        roomId: demoAlloc.roomId,
        issue: 'Broken ceiling fan',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        createdAt: new Date('2026-02-10'),
        resolvedAt: new Date('2026-02-15'),
      },
    });
  }

  console.log('  Created maintenance requests.');

  // ── 9. Student Services ──
  console.log('Creating student services records...');

  // Leave applications — 30
  for (let i = 0; i < 30; i++) {
    const studentId = randomChoice(studentIds);
    const leaveType = randomChoice(['MEDICAL', 'PERSONAL', 'EMERGENCY', 'MATERNITY', 'BEREAVEMENT', 'SPORTS', 'INTERNSHIP']);
    const startDate = randomDate(new Date('2025-09-01'), new Date('2026-06-15'));
    const durationDays = randomInt(3, 30);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const status = randomChoice(['PENDING', 'PENDING', 'APPROVED', 'APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED']);

    await prisma.leaveApplication.create({
      data: {
        studentId,
        type: leaveType,
        startDate,
        endDate,
        reason: randomChoice(LEAVE_REASONS),
        status,
        reviewedBy: status === 'APPROVED' || status === 'REJECTED' ? staffUser.id : null,
      },
    });
  }

  // Deferment requests — 10
  for (let i = 0; i < 10; i++) {
    const studentId = randomChoice(studentIds);
    const sem = randomChoice(semesters);
    const status = randomChoice(['PENDING', 'PENDING', 'APPROVED', 'REJECTED']);

    await prisma.defermentRequest.create({
      data: {
        studentId,
        reason: randomChoice([
          'Medical reasons requiring extended treatment',
          'Financial constraints affecting ability to pay fees',
          'Family responsibilities requiring attention',
          'Internship opportunity requiring full-time commitment',
          'Personal health challenges requiring rest',
        ]),
        semesterId: sem.id,
        status,
        reviewedBy: status === 'APPROVED' || status === 'REJECTED' ? staffUser.id : null,
      },
    });
  }

  // Transfer requests — 5
  for (let i = 0; i < 5; i++) {
    const studentId = randomChoice(studentIds);
    const fromProg = randomChoice(programmes);
    let toProg = randomChoice(programmes);
    while (toProg.id === fromProg.id) {
      toProg = randomChoice(programmes);
    }

    const status = randomChoice(['PENDING', 'APPROVED', 'REJECTED']);

    await prisma.transferRequest.create({
      data: {
        studentId,
        fromProgrammeId: fromProg.id,
        toProgrammeId: toProg.id,
        reason: randomChoice([
          'Change of career interest and academic passion',
          'Better job prospects in the target programme',
          'Current programme not meeting academic expectations',
          'Advised by department due to academic performance',
          'Personal interest alignment with target programme',
        ]),
        status,
        reviewedBy: status === 'APPROVED' || status === 'REJECTED' ? staffUser.id : null,
      },
    });
  }

  // Clearance records
  const clearanceStudents = randomChoices(studentIds, 40);
  for (const studentId of clearanceStudents) {
    const status = randomChoice(['PENDING', 'PENDING', 'IN_PROGRESS', 'CLEARED', 'CLEARED', 'CLEARED']);

    await prisma.clearance.create({
      data: {
        studentId,
        type: randomChoice(['GRADUATION', 'HOSTEL_EXIT', 'LIBRARY', 'FINANCE', 'GENERAL']),
        status,
        clearedBy: status === 'CLEARED' ? staffUser.id : null,
        clearedAt: status === 'CLEARED' ? randomDate(new Date('2026-01-01'), new Date('2026-06-15')) : null,
        remarks: status === 'CLEARED' ? 'All obligations met. Student cleared.' : null,
      },
    });
  }

  // Disciplinary records
  for (let i = 0; i < 20; i++) {
    const studentId = randomChoice(studentIds);
    await prisma.disciplinaryRecord.create({
      data: {
        studentId,
        incident: randomChoice([
          'Unauthorized absence from examinations',
          'Disruptive behavior in lecture hall',
          'Plagiarism in submitted assignment',
          'Hostel curfew violation',
          'Unauthorized gathering in campus',
          'Misuse of university property',
          'Academic dishonesty during examinations',
        ]),
        date: randomDate(new Date('2024-01-01'), new Date('2026-06-15')),
        action: randomChoice([
          'Written warning issued',
          'Suspended for one semester',
          'Fined KES 5,000',
          'Required to write apology letter',
          'Placed on academic probation',
          'Community service order',
        ]),
        issuedBy: staffUser.id,
      },
    });
  }

  // Appointments — 40
  for (let i = 0; i < 40; i++) {
    const studentId = randomChoice(studentIds);
    const staff = randomChoice(staffUsers);
    const apptDate = randomDate(new Date('2026-01-01'), new Date('2026-08-01'));
    const hours = randomInt(8, 16);
    const minutes = randomChoice(['00', '00', '15', '30', '45']);

    await prisma.appointment.create({
      data: {
        studentId,
        staffId: staff.id,
        date: apptDate,
        time: `${padNumber(hours, 2)}:${minutes}`,
        purpose: randomChoice([
          'Academic advising and course selection guidance',
          'Career counseling and internship opportunities',
          'Discussion of academic progress and performance',
          'Financial aid and scholarship inquiries',
          'Personal academic challenges and support needs',
          'Research project supervision meeting',
          'Industrial attachment approval and guidance',
        ]),
        status: randomChoice(['SCHEDULED', 'SCHEDULED', 'SCHEDULED', 'COMPLETED', 'COMPLETED', 'CANCELLED']),
      },
    });
  }

  // Counselling requests — 15
  for (let i = 0; i < 15; i++) {
    const studentId = randomChoice(studentIds);
    const counsellingType = randomChoice(['ACADEMIC', 'CAREER', 'PERSONAL', 'MENTAL_HEALTH', 'PEER_RELATIONS', 'FINANCIAL']);

    await prisma.counsellingRequest.create({
      data: {
        studentId,
        type: counsellingType,
        description: randomChoice(COUNSELLING_REASONS),
        status: randomChoice(['PENDING', 'PENDING', 'SCHEDULED', 'SCHEDULED', 'COMPLETED', 'CLOSED']),
        scheduledAt: Math.random() > 0.5 ? randomDate(new Date('2026-06-01'), new Date('2026-08-01')) : null,
      },
    });
  }

  // Support tickets — 30
  for (let i = 0; i < 30; i++) {
    const studentId = randomChoice(studentIds);
    await prisma.supportTicket.create({
      data: {
        studentId,
        subject: randomChoice([
          'Unable to access examination timetable',
          'Course registration error',
          'Payment not reflecting on portal',
          'Login issues with student portal',
          'Incorrect grade displayed on portal',
          'Library book not returned on system',
          'Hostel allocation system error',
          'Missing academic record',
          'Transcript request delay',
          'Scholarship application system issue',
        ]),
        description: 'Detailed description of the issue encountered while using the student portal. The system responded with an error and the issue persists after multiple attempts.',
        status: randomChoice(['OPEN', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
        priority: randomChoice(['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'URGENT']),
        assignedTo: Math.random() > 0.5 ? staffUser.id : null,
      },
    });
  }

  console.log('  Created student services records.');

  // ── 10. Notifications & Messages ──
  console.log('Creating notifications and messages...');

  // Announcements — 30
  for (const ann of ANNOUNCEMENTS) {
    const expiresOffset = randomInt(30, 120);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresOffset);

    await prisma.announcement.create({
      data: {
        ...ann,
        publishedAt: randomDate(new Date('2025-09-01'), new Date('2026-06-20')),
        expiresAt,
        createdBy: adminUser.id,
      },
    });
  }
  console.log('  Created announcements.');

  // Notifications — 200
  const allUserIds = [adminUser.id, staffUser.id, demoStudentUser.id];
  const allStudentsWithUsers = await prisma.student.findMany({
    take: 60,
    skip: 0,
    include: { user: true },
  });
  for (const s of allStudentsWithUsers) {
    allUserIds.push(s.userId);
  }

  for (let i = 0; i < 200; i++) {
    const userId = randomChoice(allUserIds);
    const isRead = Math.random() > 0.3;

    await prisma.notification.create({
      data: {
        userId,
        title: randomChoice([
          'Registration Confirmed', 'Fee Payment Received', 'Exam Timetable Published',
          'Library Book Due Reminder', 'Hostel Allocation Update', 'Scholarship Approved',
          'Course Registration Deadline', 'Academic Record Updated', 'New Announcement',
          'Sport Registration Open', 'Grade Released', 'System Maintenance Notice',
        ]),
        message: randomChoice([
          'Your examination timetable is now available on the portal.',
          'Your fee payment has been received and processed successfully.',
          'A new announcement has been published by the administration.',
          'Please complete your course registration before the deadline.',
          'Your hostel room allocation has been confirmed.',
          'Your scholarship application has been reviewed and approved.',
          'Library book borrowed is due for return within 3 days.',
          'Your semester results have been published.',
        ]),
        type: randomChoice(['INFO', 'INFO', 'INFO', 'WARNING', 'SUCCESS', 'ALERT']),
        isRead,
        channel: 'PORTAL',
      },
    });
  }

  // Demo student notifications — 5 unread
  const demoUnreadNotifications = [
    { title: 'Exam Timetable Published', message: 'Your semester examination timetable is now available. Download from the portal.', type: 'INFO' },
    { title: 'Fee Payment Reminder', message: 'Your tuition fee balance of KES 52,000 is due by October 15, 2026.', type: 'WARNING' },
    { title: 'Library Book Overdue', message: '"JavaScript: The Good Parts" is overdue. A fine of KES 300 has been applied.', type: 'ALERT' },
    { title: 'Department Representative Elections', message: 'Voting for the Computer Science Department Representative is now open. Cast your vote.', type: 'INFO' },
    { title: 'Hostel Maintenance Update', message: 'Your maintenance request for leaking pipe is being reviewed. We will update you soon.', type: 'INFO' },
  ];

  for (const n of demoUnreadNotifications) {
    await prisma.notification.create({
      data: {
        userId: demoStudentUser.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: false,
        channel: 'PORTAL',
        createdAt: randomDate(daysFromNow(-14), daysFromNow(-1)),
      },
    });
  }

  // Demo student notification preferences
  await prisma.notificationPreference.create({
    data: {
      userId: demoStudentUser.id,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
    },
  });

  // Other notification preferences for some users
  for (const userId of allUserIds.slice(0, 20)) {
    const existing = await prisma.notificationPreference.findUnique({ where: { userId } });
    if (!existing) {
      await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: Math.random() > 0.2,
          smsEnabled: Math.random() > 0.5,
          pushEnabled: Math.random() > 0.3,
        },
      });
    }
  }

  console.log('  Created notifications.');

  // Messages — 50
  for (let i = 0; i < 50; i++) {
    const sender = randomChoice(allUserIds);
    let receiver = randomChoice(allUserIds);
    while (receiver === sender) {
      receiver = randomChoice(allUserIds);
    }

    await prisma.message.create({
      data: {
        senderId: sender,
        receiverId: receiver,
        subject: randomChoice([
          'Question about course registration', 'Meeting request',
          'Regarding your application', 'Follow up on discussion',
          'Document submission', 'Schedule change', 'Important notice',
          'Request for information', 'Feedback on proposal', 'Greetings',
        ]),
        content: randomChoice([
          'I would like to schedule a meeting to discuss my academic progress this semester.',
          'Please find attached the documents you requested during our last meeting.',
          'Could you please clarify the requirements for the scholarship application?',
          'I am writing to follow up on my internship application submitted last month.',
          'Thank you for your assistance with the course registration process.',
          'The department meeting has been rescheduled to next Tuesday at 10 AM.',
          'Your request for transfer has been received and is being processed.',
          'Kindly confirm receipt of the submitted clearance documents.',
        ]),
        isRead: Math.random() > 0.4,
        sentAt: randomDate(new Date('2025-09-01'), new Date('2026-06-20')),
      },
    });
  }
  console.log('  Created messages.');

  // ── 11. Election Data ──
  console.log('Creating election records...');

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

    // Create ElectionPermission records for students
    const eligibleStudents = randomChoices(studentIds, 100);
    for (const studentId of eligibleStudents) {
      await prisma.electionPermission.create({
        data: {
          studentId,
          electionId: election.id,
          canVote: electionData.status !== ElectionStatus.CANCELLED,
          isEligible: electionData.status !== ElectionStatus.CANCELLED,
          verifiedAt: electionData.status !== ElectionStatus.CANCELLED ? randomDate(new Date('2026-05-01'), new Date('2026-06-15')) : null,
        },
      });
    }

    // Demo student eligible for all elections
    await prisma.electionPermission.upsert({
      where: { studentId_electionId: { studentId: demoStudentId, electionId: election.id } },
      update: { canVote: true, isEligible: true, verifiedAt: new Date('2026-06-01') },
      create: {
        studentId: demoStudentId,
        electionId: election.id,
        canVote: true,
        isEligible: true,
        verifiedAt: new Date('2026-06-01'),
      },
    });

    // Vote records for completed elections
    if (electionData.status === ElectionStatus.COMPLETED) {
      const candidates = await prisma.candidate.findMany({ where: { electionId: election.id } });
      if (candidates.length > 0) {
        const voters = randomChoices(eligibleStudents, randomInt(40, 80));
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
          }).catch(() => {
            // Ignore duplicate votes
          });
        }

        // Demo student voted in completed elections
        const completedCandidates = await prisma.candidate.findMany({ where: { electionId: election.id } });
        if (completedCandidates.length > 0 && election.title.includes('2025')) {
          await prisma.voteRecord.upsert({
            where: { studentId_electionId: { studentId: demoStudentId, electionId: election.id } },
            update: { candidateId: completedCandidates[0].id, method: 'PORTAL' },
            create: {
              studentId: demoStudentId,
              electionId: election.id,
              candidateId: completedCandidates[0].id,
              method: 'PORTAL',
              transactionHash: `tx-demo-${election.id.slice(0, 8)}`,
            },
          });
        }
      }
    }
  }
  console.log('  Created election records.');

  // ── 12. Integration Config ──
  console.log('Creating integration configurations...');

  const integrationConfigs = [
    { name: 'UNIELECTION_API_URL', value: 'http://localhost:4000/api', isEncrypted: false },
    { name: 'UNIELECTION_API_KEY', value: 'mock-api-key-ku-portal', isEncrypted: true },
    { name: 'PORTAL_JWT_SECRET', value: 'ku-portal-jwt-secret-dev', isEncrypted: true },
    { name: 'VOTING_JWT_SECRET', value: 'mock-voting-jwt-secret-dev', isEncrypted: true },
    { name: 'INTEGRATION_MODE', value: 'mock', isEncrypted: false },
  ];

  for (const config of integrationConfigs) {
    await prisma.integrationConfig.create({ data: config });
  }

  // ── 13. Branding Config (as IntegrationConfig entries) ──
  const brandingConfigs = [
    { name: 'UNIVERSITY_NAME', value: 'KU Demo University', isEncrypted: false },
    { name: 'PRIMARY_COLOR', value: '#1e3a5f', isEncrypted: false },
    { name: 'SECONDARY_COLOR', value: '#0d47a1', isEncrypted: false },
    { name: 'ACCENT_COLOR', value: '#d4a843', isEncrypted: false },
    { name: 'LOGO_URL', value: '/placeholder-logo.png', isEncrypted: false },
  ];

  for (const config of brandingConfigs) {
    await prisma.integrationConfig.create({ data: config });
  }

  console.log('  Created configurations.');

  // ── 14. Audit Logs ──
  console.log('Creating audit logs...');

  const auditActions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD', 'SUBMIT'];
  const auditEntities = ['User', 'Student', 'Course', 'Invoice', 'Payment', 'ExamCard', 'Transcript', 'Election'];

  for (let i = 0; i < 50; i++) {
    const userId = randomChoice(allUserIds);
    await prisma.auditLog.create({
      data: {
        userId,
        action: randomChoice(auditActions),
        entity: randomChoice(auditEntities),
        entityId: `mock-entity-${i}`,
        changes: { mock: true, timestamp: new Date().toISOString() },
        ipAddress: `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      },
    });
  }

  console.log('  Created audit logs.');

  // ── Summary ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n--- Seed Summary ---');
  console.log(`  Users: ${await prisma.user.count()}`);
  console.log(`  Students: ${await prisma.student.count()}`);
  console.log(`  Faculties: ${await prisma.faculty.count()}`);
  console.log(`  Schools: ${await prisma.school.count()}`);
  console.log(`  Departments: ${await prisma.department.count()}`);
  console.log(`  Programmes: ${await prisma.programme.count()}`);
  console.log(`  Courses: ${await prisma.course.count()}`);
  console.log(`  Semesters: ${await prisma.semester.count()}`);
  console.log(`  StudentCourses: ${await prisma.studentCourse.count()}`);
  console.log(`  AcademicRecords: ${await prisma.academicRecord.count()}`);
  console.log(`  Transcripts: ${await prisma.transcript.count()}`);
  console.log(`  Invoices: ${await prisma.invoice.count()}`);
  console.log(`  Payments: ${await prisma.payment.count()}`);
  console.log(`  Scholarships: ${await prisma.scholarship.count()}`);
  console.log(`  Books: ${await prisma.book.count()}`);
  console.log(`  BorrowRecords: ${await prisma.borrowRecord.count()}`);
  console.log(`  Reservations: ${await prisma.reservation.count()}`);
  console.log(`  DigitalResources: ${await prisma.digitalResource.count()}`);
  console.log(`  Hostels: ${await prisma.hostel.count()}`);
  console.log(`  Rooms: ${await prisma.room.count()}`);
  console.log(`  Allocations: ${await prisma.allocation.count()}`);
  console.log(`  MaintenanceRequests: ${await prisma.maintenanceRequest.count()}`);
  console.log(`  Elections: ${await prisma.election.count()}`);
  console.log(`  Candidates: ${await prisma.candidate.count()}`);
  console.log(`  VoteRecords: ${await prisma.voteRecord.count()}`);
  console.log(`  ElectionPermissions: ${await prisma.electionPermission.count()}`);

  console.log(`\nSeed completed in ${elapsed}s`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
