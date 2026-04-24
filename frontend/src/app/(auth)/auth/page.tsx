'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useLogin, useRegister } from '@/lib/hooks/useAuth';

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  passwordConfirm?: string;
  terms?: string;
}

function validateEmail(email: string): string | undefined {
  if (!email) return 'El email es requerido';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'La contraseña es requerida';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
}

function validateName(name: string): string | undefined {
  if (!name) return 'El nombre es requerido';
  if (name.length < 3) return 'El nombre debe tener al menos 3 caracteres';
}

export default function AuthPage() {
  const [loginErrors, setLoginErrors] = useState<FormErrors>({});
  const [registerErrors, setRegisterErrors] = useState<FormErrors>({});
  const loginMutation = useLogin();
  const registerMutation = useRegister();

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
    loginMutation.mutate({ email, password });
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
    registerMutation.mutate({ username: name, email, password });
  };

  const loginError = loginMutation.error?.message;
  const registerError = registerMutation.error?.message;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-white">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold">PredictaX</span>
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
                      onChange={() => setLoginErrors((prev) => ({ ...prev, email: undefined }))}
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
                      onChange={() => setLoginErrors((prev) => ({ ...prev, password: undefined }))}
                    />
                    {loginErrors.password && (
                      <div className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{loginErrors.password}</span>
                      </div>
                    )}
                  </div>

                  {loginError && (
                    <div className="flex items-center space-x-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Nombre de usuario
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="juanperez"
                      autoComplete="username"
                      aria-invalid={!!registerErrors.name}
                      onChange={() => setRegisterErrors((prev) => ({ ...prev, name: undefined }))}
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
                      onChange={() => setRegisterErrors((prev) => ({ ...prev, email: undefined }))}
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
                      onChange={() =>
                        setRegisterErrors((prev) => ({ ...prev, password: undefined }))
                      }
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
                        setRegisterErrors((prev) => ({ ...prev, passwordConfirm: undefined }))
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
                        onChange={() =>
                          setRegisterErrors((prev) => ({ ...prev, terms: undefined }))
                        }
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

                  {registerError && (
                    <div className="flex items-center space-x-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{registerError}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? 'Creando cuenta...' : 'Crear cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-white hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
