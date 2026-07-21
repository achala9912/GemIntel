'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import FormField from '@/components/FormField';
import { FEEDBACK_TYPES, RATING_OPTIONS } from '@/constants/feedback';

const feedbackSchema = z.object({
  name: z.string().min(4, { message: 'Name must be at least 4 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  feedbackType: z.string().min(1, { message: 'Please select a feedback category.' }),
  rating: z.string().min(1, { message: 'Please select a rating.' }),
  message: z.string().min(5, { message: 'Message must be at least 5 characters.' }),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      email: '',
      feedbackType: '',
      rating: '',
      message: '',
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          feedback_type: data.feedbackType,
          rating: parseInt(data.rating, 10),
          message: data.message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback. Please try again.');
      }

      setIsSubmitted(true);
      reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-width-container pt-4 sm:pt-6 pb-16 sm:pb-20 relative animate-fade-in z-10">

      <header className="text-center mb-10 sm:mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500/15 to-cyan-500/15 text-cyan-300 border border-cyan-500/20 mb-5">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>User Feedback</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3">
          Share Your <span className="gradient-text">Feedback</span>
        </h1>
        <p className="max-w-md mx-auto text-xs sm:text-sm text-gray-400 leading-relaxed px-4">
          Help us improve GemIntel. Your thoughts, reports, and suggestions are directly sent to the admin team.
        </p>
      </header>

      <div className="w-full flex justify-center px-2 sm:px-4">
        {!isSubmitted ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-3xl glass-panel p-5 sm:p-8 flex flex-col gap-5 border border-white/5 bg-slate-950/20 shadow-xl"
          >
          
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
              <FormField
                label="Full Name"
                name="name"
                placeholder="Enter your name"
                error={errors.name?.message}
                register={register('name')}
              />

              <FormField
                label="Email Address"
                name="email"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                register={register('email')}
              />
            </div>

            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
              <FormField
                label="Category"
                name="feedbackType"
                type="select"
                placeholder="Select category"
                options={FEEDBACK_TYPES}
                error={errors.feedbackType?.message}
                register={register('feedbackType')}
              />

              <FormField
                label="Rating"
                name="rating"
                type="select"
                placeholder="Select rating"
                options={RATING_OPTIONS}
                error={errors.rating?.message}
                register={register('rating')}
              />
            </div>

            <FormField
              label="Your Message"
              name="message"
              type="textarea"
              placeholder="Describe your feedback or suggestion in detail..."
              error={errors.message?.message}
              register={register('message')}
            />

            {submitError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold text-center leading-relaxed">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 text-sm sm:text-base font-bold cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Feedback...
                </>
              ) : (
                'Send Feedback'
              )}
            </button>
          </form>
        ) : (
          <div className="w-full max-w-md glass-panel p-8 sm:p-10 flex flex-col items-center text-center gap-6 border border-white/5 bg-slate-950/20 shadow-xl animate-fade-in">
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-full animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Thank You!</h2>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed px-2">
                Your feedback has been successfully submitted and delivered directly to our admins.
              </p>
            </div>

            <button
              onClick={() => setIsSubmitted(false)}
              className="btn-secondary w-full py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Submit Another Feedback
            </button>
          </div>
        )}
      </div>
    </div>
  </>
);
}
