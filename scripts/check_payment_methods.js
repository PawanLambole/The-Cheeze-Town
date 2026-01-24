const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
    console.log('Fetching recent payments...');
    const { data, error } = await supabase
        .from('payments')
        .select('payment_method, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}
check();
