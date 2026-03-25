'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { trackEvent, analyticsEvents } from '@/lib/analytics';

interface FormData {
  nombre: string;
  email: string;
  razon: string;
}

interface FormErrors {
  nombre?: string;
  email?: string;
  razon?: string;
}

export function WaitlistForm() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    razon: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Por favor ingresa un email válido';
    }

    // Validate razon (optional but has max length)
    if (formData.razon.trim().length > 500) {
      newErrors.razon = 'La razón no puede exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }

      // Track successful waitlist signup
      trackEvent(analyticsEvents.WAITLIST_JOINED, {
        email: formData.email,
        timestamp: new Date().toISOString(),
      });

      // Show success message
      setIsSuccess(true);

      // Clear form
      setFormData({
        nombre: '',
        email: '',
        razon: '',
      });
    } catch (error) {
      console.error('Waitlist submission error:', error);
      setErrors({
        email:
          error instanceof Error
            ? error.message
            : 'Hubo un error al enviar el formulario. Por favor intenta nuevamente.',
      });

      // Track error
      trackEvent(analyticsEvents.WAITLIST_FORM_ERROR, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  return (
    <div className="min-h-screen py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Únete a la lista de espera</CardTitle>
            <CardDescription className="text-lg">
              Sé de los primeros en acceder a PredictaX y recibe actualizaciones
              exclusivas sobre el lanzamiento de nuevas funcionalidades
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSuccess ? (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
                  ¡Registro exitoso!
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-4">
                  Gracias por unirte a nuestra lista de espera. Te enviaremos
                  actualizaciones a tu correo electrónico.
                </p>
                <Button
                  onClick={() => setIsSuccess(false)}
                  variant="outline"
                  className="mt-2"
                >
                  Registrar otra persona
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre Field */}
                <div className="space-y-2">
                  <Label htmlFor="nombre">
                    Nombre completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    type="text"
                    placeholder="Juan Pérez"
                    value={formData.nombre}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.nombre}
                    className={errors.nombre ? 'border-red-500' : ''}
                  />
                  {errors.nombre && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.nombre}</span>
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Correo electrónico <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.email}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Te enviaremos actualizaciones sobre el lanzamiento
                  </p>
                </div>

                {/* Razon Field */}
                <div className="space-y-2">
                  <Label htmlFor="razon">
                    ¿Por qué te interesa PredictaX?{' '}
                    <span className="text-muted-foreground text-sm">(Opcional)</span>
                  </Label>
                  <textarea
                    id="razon"
                    name="razon"
                    rows={4}
                    placeholder="Me interesa porque..."
                    value={formData.razon}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    maxLength={500}
                    className={`w-full rounded-md border ${
                      errors.razon ? 'border-red-500' : 'border-input'
                    } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                  />
                  {errors.razon && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.razon}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {formData.razon.length}/500 caracteres
                  </p>
                </div>

                {/* Info Box */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    🔒 Tu información es segura. No compartiremos tu correo con
                    terceros y podrás darte de baja en cualquier momento.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Unirme a la lista de espera'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center text-muted-foreground">
          <p className="text-sm">
            ¿Preguntas? Contáctanos en{' '}
            <a
              href="mailto:hola@predictax.com"
              className="text-primary hover:underline"
            >
              hola@predictax.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
