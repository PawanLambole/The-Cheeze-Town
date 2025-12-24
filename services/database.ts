import { supabase } from '@/config/supabase';

type WhereOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';

export const database = {
	async getAll(table: string) {
		const { data, error } = await supabase.from(table).select('*');
		return { data, error };
	},

	async getById(table: string, id: string | number) {
		const { data, error } = await supabase
			.from(table)
			.select('*')
			.eq('id', id)
			.maybeSingle();
		return { data, error };
	},

	async insert(table: string, payload: any) {
		const { data, error } = await supabase
			.from(table)
			.insert(payload)
			.select()
			.maybeSingle();
		return { data, error };
	},

	async update(table: string, id: string | number, updates: any) {
		const { data, error } = await supabase
			.from(table)
			.update(updates)
			.eq('id', id)
			.select()
			.maybeSingle();
		return { data, error };
	},

	async delete(table: string, id: string | number) {
		const { data, error } = await supabase
			.from(table)
			.delete()
			.eq('id', id)
			.select()
			.maybeSingle();
		return { data, error };
	},

	async query(table: string, column: string, operator: WhereOperator, value: any) {
		let q = supabase.from(table).select('*');
		switch (operator) {
			case 'eq':
				q = q.eq(column, value);
				break;
			case 'neq':
				q = q.neq(column, value);
				break;
			case 'gt':
				q = q.gt(column, value);
				break;
			case 'gte':
				q = q.gte(column, value);
				break;
			case 'lt':
				q = q.lt(column, value);
				break;
			case 'lte':
				q = q.lte(column, value);
				break;
		}
		const { data, error } = await q;
		return { data, error };
	},

	// Real-time subscription using Supabase Realtime
	subscribe(table: string, callback: (payload: any) => void) {
		const channel = supabase
			.channel(`${table}_changes`)
			.on('postgres_changes', { event: '*', schema: 'public', table }, callback)
			.subscribe();
		return channel;
	},

	async unsubscribe(channel: { unsubscribe?: () => void }) {
		if (channel && typeof channel.unsubscribe === 'function') {
			channel.unsubscribe();
		}
	},
};

// Re-export supabase for components that use it directly
export { supabase };
