'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/contexts/auth-store';
import api from '@/lib/api';
import { useState } from 'react';

const formSchema = z
  .object({
    username: z.string().min(2, { message: '用户名至少需要2个字符' }),
    password: z.string().min(6, { message: '密码至少需要6个字符' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不匹配',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      await api.post('/auth/register', {
        username: values.username,
        password: values.password,
      });

      const response = await api.post('/auth/login', {
        username: values.username,
        password: values.password,
      });

      const { token, user } = response.data;
      login(token, user);
      router.push('/dashboard');
    } catch (err) {
      setError('注册失败，该用户名可能已被占用。');
      console.error('Registration failed:', err);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>创建账户</CardTitle>
        <CardDescription>请输入您的信息以创建新账户。</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入用户名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="请输入密码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>确认密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="请再次输入密码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? '注册中...' : '注册'}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          已经有账户了?{' '}
          <Link href="/login" className="underline">
            登录
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
