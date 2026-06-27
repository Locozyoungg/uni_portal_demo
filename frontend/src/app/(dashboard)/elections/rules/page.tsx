'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ScrollText,
  UserCheck,
  Vote,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShieldCheck,
  FileText,
  Scale,
  Eye,
  Fingerprint,
  Lock,
  Clock,
  Ban,
  MessageSquare,
  Gavel,
  BookOpen,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ──────────────────── Types ────────────────────

interface RuleSection {
  icon: React.ElementType;
  title: string;
  description: string;
  rules: string[];
  variant?: 'default' | 'warning' | 'info' | 'success';
}

// ──────────────────── Rules Data ────────────────────

const ruleSections: RuleSection[] = [
  {
    icon: UserCheck,
    title: 'Voter Eligibility',
    description: 'Who can participate in university elections',
    rules: [
      'Must be a currently enrolled student with a valid registration for the current academic semester.',
      'Must have cleared all outstanding tuition fees or have an approved payment plan on file.',
      'Must not be under any active academic suspension, expulsion, or disciplinary interdiction.',
      'Must possess a valid university-issued student ID card for in-person verification.',
      'International and exchange students are eligible to vote in all university-wide elections.',
      'Graduating students may vote in elections that occur before their official graduation date.',
      'Students on official university exchange programs may vote electronically from abroad.',
    ],
    variant: 'info',
  },
  {
    icon: Vote,
    title: 'Voting Process',
    description: 'How to cast your vote correctly',
    rules: [
      'Voting is conducted electronically through the official student portal or the UniElection integrated platform.',
      'Each eligible voter is entitled to cast exactly one vote per position in any given election.',
      'Votes are cast anonymously using end-to-end encryption to ensure ballot secrecy.',
      'Once a vote has been submitted and confirmed, it cannot be changed, retracted, or modified for any reason.',
      'A unique transaction hash is generated for each vote as a cryptographic receipt of your participation.',
      'Voters must complete the voting process before the official closing time. Votes in progress at closing time may be forfeited.',
      'The system logs all voting activities for audit purposes while maintaining voter anonymity.',
    ],
    variant: 'default',
  },
  {
    icon: ShieldCheck,
    title: 'Code of Conduct',
    description: 'Standards of behavior for voters and candidates',
    rules: [
      'No voter shall intimidate, coerce, or unduly influence another voter\'s choice through threats, harassment, or pressure.',
      'Campaigning, including the display of campaign materials, is prohibited within 50 meters of any voting station.',
      'Voters must not share, lend, or disclose their voting credentials (password, token, or PIN) to any other person.',
      'Each voter must cast their own vote personally. Proxy voting or voting on behalf of another student is strictly forbidden.',
      'Vote buying, selling, or trading in any form — including offers of money, goods, services, or academic favors — will result in immediate disqualification and disciplinary action.',
      'All voters and candidates must respect the privacy and confidentiality of others\' voting choices.',
      'Disruptive behavior, including verbal abuse or physical confrontation at polling stations, will not be tolerated.',
      'Use of unauthorized electronic devices or recording equipment at voting stations is prohibited.',
    ],
    variant: 'warning',
  },
  {
    icon: Gavel,
    title: 'Appeals and Dispute Resolution',
    description: 'How to contest results or report irregularities',
    rules: [
      'Election results may be contested within 48 hours of the official announcement of results.',
      'All appeals must be submitted in writing to the Dean of Students office using the official appeals form.',
      'Appeals must include specific grounds, supporting evidence, and the remedy sought.',
      'The Electoral Commission will review all appeals within five (5) working days of receipt.',
      'A three-member independent panel, comprising one faculty member, one student representative, and one administrative officer, will adjudicate disputed elections.',
      'The panel\'s decision shall be final and binding on all parties, with no further internal appeal.',
      'Evidence of irregularities (screenshots, timestamps, witness statements) must be provided to support claims.',
      'Frivolous or malicious appeals may be dismissed with costs at the panel\'s discretion.',
    ],
    variant: 'info',
  },
  {
    icon: Calendar,
    title: 'Important Dates and Deadlines',
    description: 'Key timelines for the election process',
    rules: [
      'Voter registration opens three (3) weeks before the scheduled election date.',
      'Voter registration closes one (1) week before the election date. Late registrations are not accepted.',
      'The official campaign period begins two (2) weeks before the election date.',
      'All campaign activities must cease twenty-four (24) hours before voting opens (cooling-off period).',
      'Voting opens at 7:00 AM and closes at 5:00 PM on the scheduled election date(s).',
      'Preliminary results will be announced within twenty-four (24) hours of the close of voting.',
      'The swearing-in ceremony for elected officials will be held within seven (7) days of final results.',
    ],
    variant: 'warning',
  },
  {
    icon: Lock,
    title: 'Security and Privacy',
    description: 'How your vote is protected',
    rules: [
      'All voting data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.',
      'Voter identity is verified through multi-factor authentication before access to the ballot is granted.',
      'The voting system uses blockchain technology to ensure vote integrity and tamper-proof record-keeping.',
      'Individual votes are anonymized and cannot be linked back to specific voters.',
      'All voting activity is logged and monitored for suspicious patterns or irregularities.',
      'Regular security audits are conducted by independent third-party firms.',
      'Voter personal data is handled in compliance with the Data Protection Act.',
    ],
    variant: 'success',
  },
  {
    icon: Ban,
    title: 'Prohibited Activities and Penalties',
    description: 'Actions that violate election rules',
    rules: [
      'Multiple voting or attempting to vote more than once.',
      'Impersonating another student to cast a vote on their behalf.',
      'Tampering with voting systems, software, or hardware.',
      'Unauthorized access to voting records, systems, or databases.',
      'Disseminating false information about candidates or the voting process.',
      'Photographing or recording a completed ballot.',
      'Removing or damaging official election materials or notices.',
    ],
    variant: 'warning',
  },
  {
    icon: MessageSquare,
    title: 'Communication and Support',
    description: 'Where to get help and information',
    rules: [
      'For technical issues with the voting platform, contact the IT Help Desk at it-helpdesk@ku.ac.ke.',
      'For eligibility or registration inquiries, visit the Academic Registrar\'s office.',
      'For complaints about candidate conduct, email elections-complaints@ku.ac.ke.',
      'General election information is available at the Student Affairs office or online portal.',
      'Emergency voting assistance is available at designated polling stations on election day.',
    ],
    variant: 'info',
  },
];

// ──────────────────── Quick Stats ────────────────────

const quickStats = [
  { label: 'Total Sections', value: ruleSections.length, icon: ScrollText },
  { label: 'Rules Listed', value: ruleSections.reduce((sum, s) => sum + s.rules.length, 0), icon: BookOpen },
  { label: 'Enforcement', value: 'Strict', icon: Scale },
  { label: 'Last Updated', value: '2025-01-15', icon: Calendar },
];

// ──────────────────── Main Rules Page ────────────────────

export default function RulesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20">
            <ScrollText className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Election Rules</h1>
            <p className="text-sm text-muted-foreground">
              Official rules, regulations, and guidelines for university elections
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Preamble */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-l-4 border-l-ku-gold">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Scale className="h-6 w-6 shrink-0 text-ku-gold mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Preamble</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  These election rules and regulations (the &quot;Rules&quot;) govern all university elections
                  conducted through the KU Demo Student Portal and the UniElection integrated platform.
                  All students, staff, faculty, and candidates are bound by these Rules. The Electoral
                  Commission reserves the right to interpret and enforce these Rules, and to impose
                  sanctions for violations. Any amendments to these Rules shall be published at least
                  fourteen (14) days before the next election.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rule sections */}
      <div className="space-y-4">
        {ruleSections.map((section, index) => {
          const Icon = section.icon;

          const variantStyles = {
            default: 'border-l-primary',
            warning: 'border-l-amber-500',
            info: 'border-l-blue-500',
            success: 'border-l-green-500',
          };

          const iconBgStyles = {
            default: 'bg-primary/10 text-primary',
            warning: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600',
            info: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600',
            success: 'bg-green-50 dark:bg-green-950/20 text-green-600',
          };

          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
            >
              <Card className={cn('border-l-4', variantStyles[section.variant || 'default'])}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        iconBgStyles[section.variant || 'default']
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span>{section.title}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {section.rules.length} rules
                    </Badge>
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {section.rules.map((rule, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.03 }}
                        className="flex items-start gap-3 text-sm group"
                      >
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                            section.variant === 'warning'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : section.variant === 'success'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm text-muted-foreground leading-relaxed pt-0.5">
                          {rule}
                        </span>
                      </motion.li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center py-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-2">
              <Gavel className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                These rules are effective as of the date of publication and supersede all previous versions.
              </p>
              <p className="text-xs text-muted-foreground">
                For questions or clarifications, contact the Electoral Commission at{' '}
                <a href="mailto:elections@ku.ac.ke" className="text-primary underline underline-offset-2">
                  elections@ku.ac.ke
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Helper needed for variant styles
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
