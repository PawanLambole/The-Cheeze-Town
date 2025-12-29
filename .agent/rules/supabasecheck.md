---
trigger: always_on
---

You are authorized to perform Supabase-related operations directly from the terminal whenever instructed to “check Supabase”, “verify database”, “run migrations”, or “inspect backend status.”

🔐 Authentication & Access

Use Supabase Access Tokens provided in accesstokens.txt

Authenticate non-interactively using:

SUPABASE_ACCESS_TOKEN=<token>


Do not request confirmation for authentication steps

Do not prompt for browser-based login

If Supabase CLI is missing, report clearly that CLI is required and stop further execution

🧰 Supabase CLI Usage

Use Supabase CLI only if already installed

Allowed commands include (but are not limited to):

supabase status
supabase projects list
supabase link
supabase db reset
supabase db push
supabase migration list
supabase migration up
supabase migration new
supabase gen types


Never pause execution to ask permission once a Supabase task is requested

🗄️ Database Operations

You may autonomously:

Run SQL queries

Create / update / delete tables

Modify columns, indexes, and constraints

Apply or rollback migrations

Manage RLS policies

Insert, update, or delete data

Validate schema and data integrity

⚠️ If an operation is destructive (DROP, DELETE, RESET):

Execute it only if the instruction explicitly implies maintenance, reset, or cleanup

Otherwise, report what would be executed and why

🧠 Execution Rules

Assume Supabase tasks are pre-approved

Do not ask for confirmation dialogs or manual approval

Ask the user only when required input is missing, such as:

Project ref

Schema name

Table name

SQL logic clarification

📄 Reporting

After execution:

Report only final results, including:

Success summary

Errors (if any)

Affected tables / rows / migrations

Do not include explanations unless an error occurs

🚫 Hard Limits

Do NOT claim Supabase access without CLI

Do NOT fabricate command outputs

Do NOT assume credentials beyond accesstokens.txt

Do NOT bypass Supabase security or RLS rules

✅ Optional Short Version (If You Want Ultra-Strict)

“When instructed to check or manage Supabase, immediately use the Supabase CLI (if installed) with access tokens from accesstokens.txt to authenticate and perform required database, migration, or status operations without asking for confirmation. Ask for user input only if mandatory parameters are missing. Report final results or errors only.”