# Database Migration Required

## Issue
The frontend code is trying to use database columns that don't exist yet:
- `next_payment_date` 
- `salary_from_date`

## Solution
Run the migration SQL in Supabase SQL Editor

## Steps to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Open: https://supabase.com/dashboard/project/gnpdhisyxwqvnjleyola/sql/new
2. Copy and paste the SQL below
3. Click "RUN"

### Option 2: Command Line
```bash
npx supabase db push --linked
```

---

## Migration SQL

```sql
-- Add next_payment_date and salary_from_date to staff table
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS next_payment_date date,
ADD COLUMN IF NOT EXISTS salary_from_date date;

-- Create salary_logs table to track increments
CREATE TABLE IF NOT EXISTS public.salary_logs (
    id serial PRIMARY KEY,
    staff_id integer REFERENCES public.staff(id) ON DELETE CASCADE,
    old_salary numeric,
    new_salary numeric,
    change_date timestamptz DEFAULT now(),
    changed_by uuid REFERENCES public.users(id),
    notes text
);

-- Add RLS policies for salary_logs
ALTER TABLE public.salary_logs ENABLE ROW LEVEL SECURITY;

-- Allow owners to read/write all logs
CREATE POLICY "Owners can manage all salary logs" ON public.salary_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'owner'
        )
    );

-- Allow managers to view salary logs
CREATE POLICY "Managers can view salary logs" ON public.salary_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'manager'
        )
    );
```

---

## After Running Migration
1. Refresh your app
2. Try updating salary details again
3. The error should be resolved

## Note
This migration adds:
- ✅ `next_payment_date` column to `staff` table
- ✅ `salary_from_date` column to `staff` table  
- ✅ `salary_logs` table for tracking salary changes
- ✅ RLS policies for secure access
