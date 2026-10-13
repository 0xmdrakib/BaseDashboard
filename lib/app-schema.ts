import { z } from 'zod';
import { appIdPattern, normalizeAppDomain } from './app-config';

export const appSchema = z.object({
  id: z.string().regex(appIdPattern, 'Use 2–48 lowercase letters, numbers or hyphens, starting with a letter.'),
  name: z.string().trim().min(2, 'Use at least 2 characters for your app name.').max(60),
  domain: z.string().max(2048).transform((value, ctx) => {
    try { return normalizeAppDomain(value); }
    catch (error) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: error instanceof Error ? error.message : 'Enter a valid app URL.' }); return z.NEVER; }
  }),
  category: z.enum(['DeFi', 'Collectibles', 'Social', 'Commerce', 'Utility', 'Other']),
  color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  chainId: z.number().int().positive().max(2147483647),
  description: z.string().trim().max(240).default(''),
  builderCode: z.string().trim().max(100).default(''),
  archived: z.boolean().default(false),
});
