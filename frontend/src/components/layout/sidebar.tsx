'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  BookOpen,
  BookMarked,
  Award,
  ScrollText,
  FileText,
  CheckSquare,
  TrendingUp,
  Receipt,
  CreditCard,
  GraduationCap,
  Book,
  AlertCircle,
  Globe,
  Home,
  Wrench,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Vote,
  Bell,
  Mail,
  Settings,
  ChevronDown,
  GraduationCap as LogoIcon,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Academics',
    icon: BookOpen,
    items: [
      { label: 'Registration', href: '/dashboard/registration', icon: BookOpen },
      { label: 'Units', href: '/dashboard/units', icon: BookMarked },
      { label: 'Results', href: '/dashboard/results', icon: Award },
      { label: 'Transcript', href: '/dashboard/transcript', icon: ScrollText },
      { label: 'Exam Card', href: '/dashboard/exam-card', icon: FileText },
      { label: 'Attendance', href: '/dashboard/attendance', icon: CheckSquare },
      { label: 'CGPA', href: '/dashboard/cgpa', icon: TrendingUp },
    ],
  },
  {
    title: 'Finance',
    icon: Receipt,
    items: [
      { label: 'Statement', href: '/dashboard/finance/statement', icon: Receipt },
      { label: 'Payments', href: '/dashboard/finance/payments', icon: CreditCard },
      { label: 'Invoices', href: '/dashboard/finance/invoices', icon: FileText },
      { label: 'Scholarships', href: '/dashboard/finance/scholarships', icon: GraduationCap },
    ],
  },
  {
    title: 'Library',
    icon: Book,
    items: [
      { label: 'Borrowed', href: '/dashboard/library/borrowed', icon: Book },
      { label: 'Fines', href: '/dashboard/library/fines', icon: AlertCircle },
      { label: 'Resources', href: '/dashboard/library/resources', icon: Globe },
    ],
  },
  {
    title: 'Hostel',
    icon: Home,
    items: [
      { label: 'Allocation', href: '/dashboard/hostel/allocation', icon: Home },
      { label: 'Maintenance', href: '/dashboard/hostel/maintenance', icon: Wrench },
      { label: 'Payments', href: '/dashboard/hostel/payments', icon: DollarSign },
    ],
  },
  {
    title: 'Services',
    icon: Calendar,
    items: [
      { label: 'Leave', href: '/dashboard/services/leave', icon: Calendar },
      { label: 'Clearance', href: '/dashboard/services/clearance', icon: CheckCircle },
      { label: 'Appointments', href: '/dashboard/services/appointments', icon: Clock },
    ],
  },
];

const topNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
];

const bottomNavItems: NavItem[] = [
  { label: 'Student Elections', href: '/dashboard/elections', icon: Vote, highlight: true },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Messages', href: '/dashboard/messages', icon: Mail },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <nav className="flex h-full flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      {/* University Branding */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ku-navy dark:bg-ku-blue">
          <LogoIcon className="h-6 w-6 text-ku-gold" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-ku-navy dark:text-white leading-tight">
            KU Demo
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
            University Portal
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {/* Top Nav Items */}
        {topNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            onClick={onClose}
          />
        ))}

        {/* Collapsible Sections */}
        <Accordion type="multiple" className="space-y-1">
          {navSections.map((section) => {
            const sectionActive = section.items.some((item) => isActive(item.href));
            const SectionIcon = section.icon;
            return (
              <AccordionItem key={section.title} value={section.title} className="border-none">
                <AccordionTrigger
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 [&[data-state=open]>svg:last-child]:rotate-180',
                    sectionActive && 'text-primary'
                  )}
                >
                  <SectionIcon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{section.title}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-1 pl-9 space-y-1 mt-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      isActive={isActive(item.href)}
                      onClick={onClose}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Bottom Nav Items */}
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            onClick={onClose}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-3">
        <p className="text-[10px] text-gray-400 text-center">
          KU Demo v1.0.0
        </p>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Mobile Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-50 w-72 shadow-xl animate-slide-in">
            <div className="relative h-full">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebarContent}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function NavLink({
  item,
  isActive: active,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : item.highlight
            ? 'text-ku-gold hover:bg-amber-50 dark:hover:bg-amber-950/20'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={cn('h-4 w-4 shrink-0', item.highlight && 'text-ku-gold')} />
      <span>{item.label}</span>
      {item.highlight && (
        <span className="ml-auto rounded-full bg-ku-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-ku-gold">
          NEW
        </span>
      )}
    </Link>
  );
}
