'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  passwordConfirm?: string;
  terms?: string;
}

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState<FormErrors>({});
  const [registerErrors, setRegisterErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAppStore();

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'El email es requerido';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Email inválido';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    return undefined;
  };

  const validateName = (name: string): string | undefined => {
    if (!name) return 'El nombre es requerido';
    if (name.length < 3) return 'El nombre debe tener al menos 3 caracteres';
    return undefined;
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const errors: FormErrors = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    setLoginErrors({});
    setServerError(null);
    setIsLoading(true);

    try {
      const tokenRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => ({}));
        setServerError(data.detail || 'Credenciales inválidas');
        return;
      }

      const { access_token } = await tokenRes.json();
      localStorage.setItem('token', access_token);

      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userData = await meRes.json();

      login({
        id: String(userData.id),
        username: userData.username,
        email: userData.email,
        points: userData.points,
        role: userData.role || 'user',
        token: access_token,
      });

      if (userData.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/markets');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setServerError('Error de conexión. Intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const passwordConfirm = formData.get('passwordConfirm') as string;
    const terms = formData.get('terms') as string;

    const errors: FormErrors = {};
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (nameError) errors.name = nameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    if (password !== passwordConfirm) errors.passwordConfirm = 'Las contraseñas no coinciden';
    if (!terms) errors.terms = 'Debes aceptar los términos y condiciones';

    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }

    setRegisterErrors({});
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-white">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold">NeuroPredict</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bienvenido</CardTitle>
            <CardDescription>
              Inicia sesión o crea una cuenta para comenzar a predecir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email-login" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email-login"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      aria-invalid={!!loginErrors.email}
                      onChange={() => setLoginErrors({ ...loginErrors, email: undefined })}
                    />
                    {loginErrors.email && (
                      <div className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{loginErrors.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password-login" className="text-sm font-medium">
                        Contraseña
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <Input
                      id="password-login"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={!!loginErrors.password}
                      onChange={() => setLoginErrors({ ...loginErrors, password: undefined })}
                    />
                    {loginErrors.password && (
                      <div className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{loginErrors.password}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="remember" className="text-sm text-gray-600">
                      Recordarme
                    </label>
                  </div>

                  {serverError && (
                    <div className="flex items-center space-x-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{serverError}</span>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">O continúa con</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button variant="outline" type="button">
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button variant="outline" type="button">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      X
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Nombre completo
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Juan Pérez"
                      autoComplete="name"
                      aria-invalid={!!registerErrors.name}
                      onChange={() => setRegisterErrors({ ...registerErrors, name: undefined })}
                    />
                    {registerErrors.name && (
                      <div className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{registerErrors.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email-register" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email-register"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      aria-invalid={!!registerErrors.email}
                      onChange={() => setRegisterErrors({ ...registerErrors, email: undefined })}
                    />
                    {registerErrors.email && (
                      <div className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{registerErrors.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password-register" className="text-sm font-medium">
                      Contraseña
                    </label>
                    <Input
                      id="password-register"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-invalid={!!registerErrors.password}
                      onChange={() => setRegisterErrors({ ...registerErrors, password: undefined })}
                    />
                    {registerErrors.password && (
                      <div className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{registerErrors.password}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password-confirm" className="text-sm font-medium">
                      Confirmar contraseña
                    </label>
                    <Input
                      id="password-confirm"
                      name="passwordConfirm"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-invalid={!!registerErrors.passwordConfirm}
                      onChange={() =>
                        setRegisterErrors({ ...registerErrors, passwordConfirm: undefined })
                      }
                    />
                    {registerErrors.passwordConfirm && (
                      <div className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{registerErrors.passwordConfirm}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="terms"
                        name="terms"
                        className="rounded border-gray-300 mt-1"
                        onChange={() => setRegisterErrors({ ...registerErrors, terms: undefined })}
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600">
                        Acepto los{' '}
                        <Link href="/terms" className="text-blue-600 hover:underline">
                          términos y condiciones
                        </Link>{' '}
                        y la{' '}
                        <Link href="/privacy" className="text-blue-600 hover:underline">
                          política de privacidad
                        </Link>
                      </label>
                    </div>
                    {registerErrors.terms && (
                      <div className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{registerErrors.terms}</span>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">O regístrate con</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button variant="outline" type="button">
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button variant="outline" type="button">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      X
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer link */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-white hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
