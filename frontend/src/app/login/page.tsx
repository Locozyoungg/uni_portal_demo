'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Lock, Eye, EyeOff, GraduationCap, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  username: z.string().min(1, 'Username or Admission Number is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleLoginTypeChange = (value: string) => {
    const type = value as 'student' | 'admin';
    setLoginType(type);
    if (type === 'student') {
      setValue('username', '');
    } else {
      setValue('username', '');
    }
    setValue('password', '');
  };

  const fillDemoCredentials = (type: 'student' | 'admin') => {
    if (type === 'student') {
      setValue('username', 'P100/1234/2023');
      setValue('password', 'password123');
    } else {
      setValue('username', 'admin');
      setValue('password', 'admin123');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data.username, data.password);
      toast.success('Login successful! Welcome back.');
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response: { data?: { message?: string } } }).response?.data?.message
          : 'Login failed. Please check your credentials.';
      toast.error(message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Side - Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative hidden w-3/5 flex-col justify-between bg-ku-navy p-12 text-white lg:flex"
      >
        {/* Decorative overlay patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-ku-gold/5" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-ku-blue/10" />
          <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-ku-gold/5" />
        </div>

        <div className="relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-3"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ku-gold shadow-lg">
              <GraduationCap className="h-8 w-8 text-ku-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">KU Demo University</h1>
              <p className="text-sm text-ku-gold/80">Student Portal</p>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-4xl font-bold leading-tight tracking-tight">
                Your Gateway to
                <span className="text-ku-gold"> Academic Excellence</span>
              </h2>
            </motion.div>
            <motion.p variants={itemVariants} className="text-lg text-white/60">
              Access your courses, grades, library resources, and everything you need to succeed
              in your academic journey.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-6 pt-4">
              {[
                { label: 'Course Registration', desc: 'Manage your units' },
                { label: 'Academic Records', desc: 'View your grades' },
                { label: 'Library Access', desc: 'Digital resources' },
                { label: 'Elections', desc: 'Cast your vote' },
              ].map((feature) => (
                <div key={feature.label} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-ku-gold" />
                  <div>
                    <p className="text-sm font-medium">{feature.label}</p>
                    <p className="text-xs text-white/50">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className="relative z-10 text-sm text-white/40">
          &copy; {new Date().getFullYear()} KU Demo University. All rights reserved.
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex w-full items-center justify-center bg-white p-8 lg:w-2/5"
      >
        <div className="w-full max-w-md">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Mobile header */}
            <motion.div variants={itemVariants} className="lg:hidden">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ku-navy">
                  <GraduationCap className="h-6 w-6 text-ku-gold" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ku-navy">KU Demo University</h2>
                  <p className="text-xs text-ku-gray">Student Portal</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold text-ku-navy">Welcome Back</h2>
              <p className="mt-1 text-ku-gray">Sign in to access your student portal</p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Tabs
                defaultValue="student"
                value={loginType}
                onValueChange={handleLoginTypeChange}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="student" className="text-sm">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="text-sm">
                    <LogIn className="mr-2 h-4 w-4" />
                    Administrator
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="student" className="mt-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-ku-navy" htmlFor="username">
                        Admission Number
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ku-gray" />
                        <Input
                          id="username"
                          placeholder="P100/1234/2023"
                          className={cn(
                            'pl-10',
                            errors.username && 'border-red-500 focus-visible:ring-red-500'
                          )}
                          {...register('username')}
                        />
                      </div>
                      {errors.username && (
                        <p className="text-xs text-red-500">{errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-ku-navy" htmlFor="password">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ku-gray" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className={cn(
                            'pl-10 pr-10',
                            errors.password && 'border-red-500 focus-visible:ring-red-500'
                          )}
                          {...register('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-ku-gray hover:text-ku-navy"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-500">{errors.password.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-ku-navy py-5 text-white hover:bg-ku-blue"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Signing In...
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>

                  <div className="mt-4 rounded-lg border border-dashed border-ku-gold/30 bg-ku-gold/5 p-3">
                    <p className="mb-1 text-xs font-medium text-ku-navy">Demo Credentials</p>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('student')}
                      className="text-xs text-ku-blue hover:text-ku-royal hover:underline"
                    >
                      Student: P100/1234/2023 / password123
                    </button>
                  </div>
                </TabsContent>

                <TabsContent value="admin" className="mt-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-ku-navy" htmlFor="admin-username">
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ku-gray" />
                        <Input
                          id="admin-username"
                          placeholder="admin"
                          className={cn(
                            'pl-10',
                            errors.username && 'border-red-500 focus-visible:ring-red-500'
                          )}
                          {...register('username')}
                        />
                      </div>
                      {errors.username && (
                        <p className="text-xs text-red-500">{errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-ku-navy" htmlFor="admin-password">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ku-gray" />
                        <Input
                          id="admin-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className={cn(
                            'pl-10 pr-10',
                            errors.password && 'border-red-500 focus-visible:ring-red-500'
                          )}
                          {...register('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-ku-gray hover:text-ku-navy"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-500">{errors.password.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-ku-navy py-5 text-white hover:bg-ku-blue"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Signing In...
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>

                  <div className="mt-4 rounded-lg border border-dashed border-ku-gold/30 bg-ku-gold/5 p-3">
                    <p className="mb-1 text-xs font-medium text-ku-navy">Demo Credentials</p>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('admin')}
                      className="text-xs text-ku-blue hover:text-ku-royal hover:underline"
                    >
                      Admin: admin / admin123
                    </button>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
