'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  GraduationCap,
  DollarSign,
  Calendar,
  CreditCard,
  Clock,
  Award,
  FileText,
  PhoneCall,
  Contact,
  Building,
  School,
  BookMarked,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  cn,
  formatCurrency,
  formatDate,
  getStatusColor,
  getInitials,
} from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  faculty: { name: string };
  school: { name: string };
  department: { name: string };
  programme: { name: string };
  yearOfStudy: number;
  currentSemester: string;
  phone: string;
  email: string;
  nationalId: string;
  emergencyContact: string;
  enrollmentStatus: string;
  feeStatus: string;
  feeBalance: number;
  cgpa: number;
  academicStanding: string;
  totalCredits: number;
  totalCreditsRequired: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  gpaHistory: Array<{ semester: string; gpa: number }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    date: string;
    description: string;
    status: string;
  }>;
}

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// ── Profile Field ──────────────────────────────────────────────────────────

function ProfileField({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50">
      <div className="mt-0.5 rounded-lg bg-ku-navy/5 p-2 text-ku-navy">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm font-medium text-ku-navy">{value || 'N/A'}</p>
          {badge}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2 text-center sm:text-left">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-96" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <User className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load profile</h3>
      <p className="mt-1 text-sm text-gray-500">
        Unable to fetch your profile data. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Personal Info Tab ──────────────────────────────────────────────────────

function PersonalInfoTab({ profile }: { profile: StudentProfile }) {
  return (
    <motion.div
      key="personal"
      variants={tabContentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-ku-navy">Personal Information</CardTitle>
          <CardDescription>Your registered personal and academic details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <ProfileField icon={User} label="First Name" value={profile.firstName} />
            <ProfileField icon={User} label="Last Name" value={profile.lastName} />
            <ProfileField
              icon={Contact}
              label="Admission Number"
              value={profile.admissionNumber}
            />
            <ProfileField
              icon={Building}
              label="Faculty"
              value={profile.faculty?.name}
            />
            <ProfileField
              icon={School}
              label="School"
              value={profile.school?.name}
            />
            <ProfileField
              icon={BookMarked}
              label="Department"
              value={profile.department?.name}
            />
            <ProfileField
              icon={GraduationCap}
              label="Programme"
              value={profile.programme?.name}
            />
            <ProfileField icon={Calendar} label="Year of Study" value={`Year ${profile.yearOfStudy}`} />
            <ProfileField icon={Clock} label="Current Semester" value={profile.currentSemester} />
            <ProfileField icon={Phone} label="Phone" value={profile.phone} />
            <ProfileField icon={Mail} label="Email" value={profile.email} />
            <ProfileField icon={Contact} label="National ID" value={profile.nationalId} />
            <ProfileField
              icon={PhoneCall}
              label="Emergency Contact"
              value={profile.emergencyContact}
            />
            <ProfileField
              icon={Award}
              label="Fee Status"
              value={
                <Badge className={getStatusColor(profile.feeStatus)} variant="secondary">
                  {profile.feeStatus || 'N/A'}
                </Badge>
              }
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Academic Info Tab ──────────────────────────────────────────────────────

function AcademicInfoTab({ profile }: { profile: StudentProfile }) {
  const graduationProgress = profile.totalCreditsRequired
    ? Math.min(Math.round((profile.totalCredits / profile.totalCreditsRequired) * 100), 100)
    : 0;

  const gpaData = profile.gpaHistory?.length
    ? profile.gpaHistory
    : [{ semester: 'N/A', gpa: 0 }];

  return (
    <motion.div
      key="academic"
      variants={tabContentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* GPA Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-ku-navy">GPA History</CardTitle>
            <CardDescription>Your academic performance across semesters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gpaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="semester"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    domain={[0, 4]}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gpa"
                    stroke="#1e3a5f"
                    strokeWidth={2}
                    dot={{ fill: '#1e3a5f', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#d4a843', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 rounded-full bg-ku-navy/5 p-4">
                  <Award className="h-8 w-8 text-ku-gold" />
                </div>
                <p className="text-sm text-gray-500">Current CGPA</p>
                <p className="text-4xl font-bold text-ku-navy">{profile.cgpa?.toFixed(2) || 'N/A'}</p>
                <p className="text-xs text-gray-400">out of 4.0</p>
                <Badge
                  className={cn(
                    'mt-3',
                    profile.academicStanding === 'GOOD'
                      ? 'bg-green-50 text-green-600'
                      : profile.academicStanding === 'PROBATION'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-yellow-50 text-yellow-600'
                  )}
                  variant="secondary"
                >
                  {profile.academicStanding || 'N/A'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credits Completed</p>
                  <p className="text-xl font-bold text-ku-navy">
                    {profile.totalCredits || 0}
                    <span className="text-sm font-normal text-gray-400">
                      {' '}
                      / {profile.totalCreditsRequired || 0}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Graduation Progress</span>
                  <span>{graduationProgress}%</span>
                </div>
                <Progress value={graduationProgress} className="mt-1 h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// ── Fee Summary Tab ────────────────────────────────────────────────────────

function FeeSummaryTab({ profile }: { profile: StudentProfile }) {
  const isClear = profile.feeBalance <= 0;
  const balanceColor = isClear
    ? 'text-green-600'
    : profile.feeBalance > 50000
      ? 'text-red-600'
      : 'text-ku-gold';

  return (
    <motion.div
      key="fee"
      variants={tabContentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Balance Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-ku-navy">Fee Summary</CardTitle>
            <CardDescription>Your current fee balance and payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-8 text-center">
              <div className={cn('mb-4 rounded-full p-4', isClear ? 'bg-green-50' : 'bg-orange-50')}>
                <DollarSign
                  className={cn('h-10 w-10', isClear ? 'text-green-600' : 'text-orange-600')}
                />
              </div>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className={cn('text-4xl font-bold', balanceColor)}>
                {formatCurrency(profile.feeBalance ?? 0)}
              </p>
              <Badge
                className={cn('mt-3', getStatusColor(profile.feeStatus))}
                variant="secondary"
              >
                {profile.feeStatus === 'CLEAR' ? 'Fully Paid' : profile.feeStatus || 'N/A'}
              </Badge>

              <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/fee-balance">
                    <FileText className="mr-2 h-4 w-4" />
                    View Full Fee Statement
                  </Link>
                </Button>
                <Button asChild className="w-full bg-ku-navy text-white hover:bg-ku-blue">
                  <Link href="/fee-payment">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Make Payment
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Last Payment */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-green-50 p-2 text-green-600">
                  <CreditCard className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-ku-navy">Last Payment</p>
              </div>
              {profile.lastPaymentDate ? (
                <div>
                  <p className="text-lg font-bold text-ku-navy">
                    {formatCurrency(profile.lastPaymentAmount ?? 0)}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(profile.lastPaymentDate)}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No payments recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats mini */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="text-sm font-medium text-ku-navy">15th of each month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-ku-navy">Recent Payments</CardTitle>
          <CardDescription>Your latest fee payments</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.recentPayments && profile.recentPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.recentPayments.slice(0, 5).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(payment.date)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-ku-navy">
                      {payment.description}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-ku-navy">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={getStatusColor(payment.status)} variant="secondary">
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <DollarSign className="h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No payment records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();
  const studentId = user?.student?.id;

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<{ data: StudentProfile }>({
    queryKey: ['student-profile', studentId],
    queryFn: () => api.get(`/students/${studentId}`).then((res) => res.data),
    enabled: !!studentId,
  });

  const profile = data?.data;

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (isError || !profile) {
    return (
      <div className="p-6">
        <ProfileError onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-ku-navy to-ku-blue text-white">
          <div className="absolute right-0 top-0 h-48 w-48 translate-x-16 -translate-y-16 rounded-full bg-ku-gold/10" />
          <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-8 translate-y-8 rounded-full bg-white/5" />
          <CardContent className="relative z-10 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <Avatar className="h-20 w-20 border-4 border-ku-gold shadow-lg sm:h-24 sm:w-24">
                <AvatarFallback className="bg-ku-gold/20 text-xl font-bold text-ku-gold sm:text-2xl">
                  {getInitials(profile.firstName, profile.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {profile.firstName} {profile.lastName}
                </h1>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Badge className="border-ku-gold/30 bg-ku-gold/20 text-ku-gold">
                    {profile.admissionNumber}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                    {profile.programme?.name}
                  </Badge>
                </div>
                <div className="mt-4">
                  <Badge className={getStatusColor(profile.enrollmentStatus)}>
                    {profile.enrollmentStatus === 'ACTIVE' ? 'Active' : profile.enrollmentStatus || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="personal" className="text-sm">
              <User className="mr-2 h-4 w-4" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="academic" className="text-sm">
              <GraduationCap className="mr-2 h-4 w-4" />
              Academic Info
            </TabsTrigger>
            <TabsTrigger value="fee" className="text-sm">
              <DollarSign className="mr-2 h-4 w-4" />
              Fee Summary
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <TabsContent value="personal" className="mt-0">
                <PersonalInfoTab profile={profile} />
              </TabsContent>
              <TabsContent value="academic" className="mt-0">
                <AcademicInfoTab profile={profile} />
              </TabsContent>
              <TabsContent value="fee" className="mt-0">
                <FeeSummaryTab profile={profile} />
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
