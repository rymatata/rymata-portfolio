// lib/schemas/contact.ts defines a zod schema for name, email and message, 
// plus a honeypot field that must stay empty.

// ContactForm.tsx uses useForm with zodResolver(schema). 
// Its onSubmit calls the server action directly.

// contact/actions.ts starts with "use server". It re-validates with safeParse, 
// silently drops honeypot hits, and POSTs to Resend's REST API with native fetch. 
// It returns { ok, error? } instead of throwing.

// .env.local holds RESEND_API_KEY and CONTACT_EMAIL, already gitignored by .env*. Never prefix them with NEXT_PUBLIC_.