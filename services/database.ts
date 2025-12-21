import { supabase } from '../config/supabase';

// Database Service - Provides an abstraction layer for database operations

/**
 * Generic database operations
 */
export const database = {
    /**
     * Fetch all records from a table
     * @param tableName - Name of the table
     * @returns Promise with data and error
     */
    async getAll(tableName: string) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*');

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error(`Error fetching all from ${tableName}:`, error);
            return { data: null, error };
        }
    },

    /**
     * Fetch a single record by ID
     * @param tableName - Name of the table
     * @param id - Record ID
     * @returns Promise with data and error
     */
    async getById(tableName: string, id: string | number) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error(`Error fetching ${tableName} by ID:`, error);
            return { data: null, error };
        }
    },

    /**
     * Insert a new record
     * @param tableName - Name of the table
     * @param data - Data to insert
     * @returns Promise with data and error
     */
    async insert(tableName: string, data: any) {
        try {
            const { data: insertedData, error } = await supabase
                .from(tableName)
                .insert(data)
                .select()
                .single();

            if (error) throw error;
            return { data: insertedData, error: null };
        } catch (error) {
            console.error(`Error inserting into ${tableName}:`, error);
            return { data: null, error };
        }
    },

    /**
     * Insert multiple records
     * @param tableName - Name of the table
     * @param data - Array of data to insert
     * @returns Promise with data and error
     */
    async insertMany(tableName: string, data: any[]) {
        try {
            const { data: insertedData, error } = await supabase
                .from(tableName)
                .insert(data)
                .select();

            if (error) throw error;
            return { data: insertedData, error: null };
        } catch (error) {
            console.error(`Error inserting multiple into ${tableName}:`, error);
            return { data: null, error };
        }
    },

    /**
     * Update a record by ID
     * @param tableName - Name of the table
     * @param id - Record ID
     * @param data - Data to update
     * @returns Promise with data and error
     */
    async update(tableName: string, id: string | number, data: any) {
        try {
            const { data: updatedData, error } = await supabase
                .from(tableName)
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data: updatedData, error: null };
        } catch (error) {
            console.error(`Error updating ${tableName}:`, error);
            return { data: null, error };
        }
    },

    /**
     * Delete a record by ID
     * @param tableName - Name of the table
     * @param id - Record ID
     * @returns Promise with error
     */
    async delete(tableName: string, id: string | number) {
        try {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error(`Error deleting from ${tableName}:`, error);
            return { error };
        }
    },

    /**
     * Query with custom filters
     * @param tableName - Name of the table
     * @param column - Column to filter
     * @param operator - Comparison operator (eq, gt, lt, gte, lte, like, etc.)
     * @param value - Value to compare
     * @returns Promise with data and error
     */
    async query(tableName: string, column: string, operator: string, value: any) {
        try {
            let query = supabase.from(tableName).select('*');

            // Apply the filter based on the operator
            switch (operator) {
                case 'eq':
                    query = query.eq(column, value);
                    break;
                case 'neq':
                    query = query.neq(column, value);
                    break;
                case 'gt':
                    query = query.gt(column, value);
                    break;
                case 'gte':
                    query = query.gte(column, value);
                    break;
                case 'lt':
                    query = query.lt(column, value);
                    break;
                case 'lte':
                    query = query.lte(column, value);
                    break;
                case 'like':
                    query = query.like(column, value);
                    break;
                case 'ilike':
                    query = query.ilike(column, value);
                    break;
                default:
                    query = query.eq(column, value);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error(`Error querying ${tableName}:`, error);
            return { data: null, error };
        }
    },

    /**
     * Subscribe to real-time changes on a table
     * @param tableName - Name of the table
     * @param callback - Callback function to handle changes
     * @returns Subscription object
     */
    subscribe(tableName: string, callback: (payload: any) => void) {
        const subscription = supabase
            .channel(`${tableName}_changes`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: tableName },
                callback
            )
            .subscribe();

        return subscription;
    },

    /**
     * Unsubscribe from a channel
     * @param subscription - Subscription object to unsubscribe
     */
    async unsubscribe(subscription: any) {
        await supabase.removeChannel(subscription);
    },
};

// Export the supabase client for advanced usage
export { supabase };
