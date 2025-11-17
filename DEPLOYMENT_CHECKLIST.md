# Vercel Deployment Checklist

## Pre-Deployment Preparation

### 1. Environment Variables Setup
- [ ] Ensure all required environment variables are configured in Vercel dashboard:
  - [ ] `VITE_SUPABASE_URL` (set to production Supabase URL)
  - [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` (set to production key)
  - [ ] `VITE_SUPABASE_PROJECT_ID` (set to production project ID)
  - [ ] Any payment gateway keys (e.g., `INSTAMOJO_CLIENT_ID`, `INSTAMOJO_CLIENT_SECRET`) if used in production
- [ ] Verify environment variables are properly prefixed with `VITE_` for client-side access
- [ ] Confirm production environment variables are different from local/development ones

### 2. Supabase Configuration
- [ ] Ensure Supabase project is properly configured for production
- [ ] Verify all database migrations are applied to production Supabase instance
- [ ] Confirm Supabase Edge Functions are deployed (if any)
- [ ] Check that database tables and policies are correctly set up
- [ ] Ensure RLS (Row Level Security) policies are properly configured

### 3. Build Configuration Verification
- [ ] Confirm `vite.config.ts` has correct base path (currently set to `/`)
- [ ] Verify build output directory is `dist`
- [ ] Check that SPA routing is properly configured with `_redirects` file in `public/` folder
- [ ] Ensure all dependencies are listed in `package.json` and no dev dependencies are missing

## Build Process

### 4. Local Build Testing
- [ ] Run `npm run build` locally to ensure build completes without errors
- [ ] Verify build output is generated in `dist/` directory
- [ ] Test build output locally using `npm run preview` or `npx serve -s dist`
- [ ] Confirm all routes work correctly in local preview
- [ ] Check browser console for any runtime errors

### 5. Code Quality Checks
- [ ] Run `npm run lint` to ensure no linting errors
- [ ] Verify TypeScript compilation passes without errors
- [ ] Check for any unused imports or dead code
- [ ] Ensure all console.log statements are removed or properly handled for production

## Deployment Steps

### 6. Vercel Deployment
- [ ] Connect repository to Vercel (if not already connected)
- [ ] Configure build settings in Vercel dashboard:
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
  - [ ] Install Command: `npm install`
- [ ] Set environment variables in Vercel environment settings
- [ ] Trigger deployment manually or push to connected branch

### 7. Post-Deployment Verification
- [ ] Wait for deployment to complete successfully
- [ ] Check deployment logs for any errors or warnings
- [ ] Verify the deployed URL loads without blank page
- [ ] Test all major routes:
  - [ ] Home page (`/`)
  - [ ] Authentication pages (`/auth`)
  - [ ] Assessment pages (`/get-assessed`, `/request-assessment`, `/take-assessment/:id`)
  - [ ] Profile pages (`/my-skill-profile`)
  - [ ] Payment success page (`/payment-success`)
- [ ] Test user interactions (login, registration, assessments)
- [ ] Verify Supabase integration works (database queries, auth)
- [ ] Check responsive design on different screen sizes
- [ ] Test forms and user inputs for proper validation

## Troubleshooting Steps

### 8. Common Issues Resolution
- [ ] If blank page appears:
  - [ ] Check browser console for JavaScript errors
  - [ ] Verify environment variables are correctly set in Vercel
  - [ ] Confirm base path configuration in `vite.config.ts`
  - [ ] Ensure `_redirects` file is properly deployed
- [ ] If routing fails:
  - [ ] Verify `_redirects` file is in `public/` and deployed
  - [ ] Check that all routes are properly defined in React Router
- [ ] If Supabase fails:
  - [ ] Confirm production environment variables match Vercel settings
  - [ ] Check Supabase project status and API keys
  - [ ] Verify database connectivity and permissions
- [ ] If build fails:
  - [ ] Check build logs for specific error messages
  - [ ] Ensure all dependencies are compatible with Node.js version on Vercel
  - [ ] Verify TypeScript types and imports are correct

## Performance and Monitoring

### 9. Performance Checks
- [ ] Verify images are properly optimized
- [ ] Check bundle size is reasonable
- [ ] Test loading times on different connections
- [ ] Monitor for any runtime performance issues

### 10. Monitoring Setup
- [ ] Set up error tracking (e.g., Sentry) if not already configured
- [ ] Configure analytics tracking for production
- [ ] Set up uptime monitoring for the deployed application

## Rollback Plan

### 11. Emergency Rollback
- [ ] Keep previous working deployment available
- [ ] Document rollback steps in case of critical issues
- [ ] Test rollback process before going live

---

**Note:** This checklist should be reviewed and updated as the application evolves. Always test deployments in a staging environment before production releases.