'use client';

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, AlertCircle, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useRequestOTP, useVerifyOTP, useRegister } from '@/lib/hooks/useAuth';

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  passwordConfirm?: string;
  terms?: string;
  privacy?: string;
  age?: string;
}

const LEGAL_CONSENT_VERSION = '2026-05-21';

function validateEmail(email: string): string | undefined {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) return 'El email es requerido';
  if (normalizedEmail.length > 255) return 'El email es demasiado largo';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return 'Email inválido';
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'La contraseña es requerida';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
}

function validateName(name: string): string | undefined {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) return 'El nombre es requerido';
  if (normalizedName.length < 3) return 'El nombre debe tener al menos 3 caracteres';
  if (normalizedName.length > 30) return 'El nombre debe tener máximo 30 caracteres';
  if (!/^[a-z0-9_-]+$/.test(normalizedName)) {
    return 'Usá solo letras, números, guion bajo o guion medio';
  }
}

function LegalCheckbox({
  id,
  label,
  error,
  optional = false,
  onChange,
}: {
  id: string;
  label: ReactNode;
  error?: string;
  optional?: boolean;
  onChange?: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start space-x-2">
        <input
          type="checkbox"
          id={id}
          name={id}
          className="mt-1 rounded border-gray-300"
          aria-invalid={!!error}
          aria-required={!optional}
          onChange={onChange}
        />
        <label htmlFor={id} className="text-sm leading-5 text-gray-600">
          {label}
        </label>
      </div>
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ── OTP Login (2-step: email → code) ─────────────────────────────────────────

type OTPStep = 'email' | 'code';

function OTPLoginForm() {
  const [step, setStep] = useState<OTPStep>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>();
  const [countdown, setCountdown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const requestOTP = useRequestOTP();
  const verifyOTP = useVerifyOTP();

  // Countdown timer after code is sent
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const handleEmailSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError(undefined);
    requestOTP.mutate(
      { email },
      {
        onSuccess: () => {
          setStep('code');
          setCountdown(600); // 10 min in seconds
          setTimeout(() => codeInputRef.current?.focus(), 100);
        },
        onError: (err) => setEmailError(err.message),
      }
    );
  };

  const handleCodeSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (code.length !== 6) { setCodeError('El código debe tener 6 dígitos'); return; }
    setCodeError(undefined);
    verifyOTP.mutate(
      { email, code },
      { onError: (err) => setCodeError(err.message) }
    );
  };

  const handleResend = () => {
    setCode('');
    setCodeError(undefined);
    requestOTP.mutate(
      { email },
      {
        onSuccess: () => setCountdown(600),
        onError: (err) => setCodeError(err.message),
      }
    );
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const countdownStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

  if (step === 'email') {
    return (
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="otp-email" className="text-sm font-medium">Tu email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="otp-email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              className="pl-9"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(undefined); }}
              aria-invalid={!!emailError}
              disabled={requestOTP.isPending}
            />
          </div>
          {emailError && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /><span>{emailError}</span>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={requestOTP.isPending}>
          {requestOTP.isPending ? 'Enviando código...' : 'Enviar código →'}
        </Button>

        <p className="text-xs text-center text-gray-500">
          Te enviamos un código de 6 dígitos. Sin contraseña.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleCodeSubmit} className="space-y-4">
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Código enviado a</p>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{email}</p>
        </div>
        <button
          type="button"
          onClick={() => { setStep('email'); setCode(''); setCodeError(undefined); }}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          aria-label="Cambiar email"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="otp-code" className="text-sm font-medium">Código de 6 dígitos</label>
          {countdown > 0 && (
            <span className="text-xs text-gray-500">Expira en {countdownStr}</span>
          )}
        </div>
        <Input
          id="otp-code"
          ref={codeInputRef}
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          placeholder="123456"
          autoComplete="one-time-code"
          className="text-center text-2xl font-bold tracking-[0.5em] h-14"
          value={code}
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setCodeError(undefined); }}
          aria-invalid={!!codeError}
          disabled={verifyOTP.isPending}
        />
        {codeError && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" /><span>{codeError}</span>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={verifyOTP.isPending || code.length !== 6}>
        {verifyOTP.isPending ? 'Verificando...' : 'Ingresar'}
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={requestOTP.isPending || countdown > 570}
        className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {requestOTP.isPending ? 'Enviando...' : 'Reenviar código'}
      </button>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [registerErrors, setRegisterErrors] = useState<FormErrors>({});
  const registerMutation = useRegister();

  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') ?? '')
      .trim()
      .toLowerCase();
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();
    const password = formData.get('password') as string;
    const passwordConfirm = formData.get('passwordConfirm') as string;
    const termsAccepted = formData.get('termsAccepted') === 'on';
    const privacyAccepted = formData.get('privacyAccepted') === 'on';
    const isAdult = formData.get('isAdult') === 'on';
    const marketingOptIn = formData.get('marketingOptIn') === 'on';

    const errors: FormErrors = {};
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (nameError) errors.name = nameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    if (password !== passwordConfirm) errors.passwordConfirm = 'Las contraseñas no coinciden';
    if (!termsAccepted) errors.terms = 'Debes aceptar los términos y condiciones';
    if (!privacyAccepted) errors.privacy = 'Debes aceptar la política de privacidad';
    if (!isAdult) errors.age = 'Debes declarar que sos mayor de 18 años';
    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }

    setRegisterErrors({});
    registerMutation.mutate({
      username: name,
      email,
      password,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted,
      is_adult: isAdult,
      marketing_opt_in: marketingOptIn,
      legal_consent_version: LEGAL_CONSENT_VERSION,
    });
  };

  const registerError = registerMutation.error?.message;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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

              {/* Login Tab — OTP flow */}
              <TabsContent value="login">
                <OTPLoginForm />
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

                  <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <LegalCheckbox
                      id="termsAccepted"
                      label={
                        <>
                          Acepto los{' '}
                          <Link href="/terms" className="text-blue-600 hover:underline">
                            términos y condiciones
                          </Link>
                        </>
                      }
                      error={registerErrors.terms}
                      onChange={() => setRegisterErrors((prev) => ({ ...prev, terms: undefined }))}
                    />

                    <LegalCheckbox
                      id="privacyAccepted"
                      label={
                        <>
                          Acepto la{' '}
                          <Link href="/privacy" className="text-blue-600 hover:underline">
                            política de privacidad
                          </Link>
                        </>
                      }
                      error={registerErrors.privacy}
                      onChange={() =>
                        setRegisterErrors((prev) => ({ ...prev, privacy: undefined }))
                      }
                    />

                    <LegalCheckbox
                      id="isAdult"
                      label="Declaro ser mayor de 18 años y entiendo que NeuroPredict usa puntos virtuales sin valor monetario."
                      error={registerErrors.age}
                      onChange={() => setRegisterErrors((prev) => ({ ...prev, age: undefined }))}
                    />

                    <LegalCheckbox
                      id="marketingOptIn"
                      label="Quiero recibir novedades del MVP y mercados del Mundial 2026 por email."
                      optional
                    />
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
