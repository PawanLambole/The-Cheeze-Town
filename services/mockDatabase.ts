// Mock Database Service - Simulates Supabase with dummy data
// This replaces the real database with in-memory mock data

export interface MockUser {
    id: string;
    email: string;
    name: string;
    role: 'owner' | 'manager' | 'chef' | 'waiter';
    phone: string;
    status: string;
}

export interface MockOrder {
    id: number;
    order_number: string;
    table_id: number;
    status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    total_amount: number;
    customer_name?: string;
    notes?: string;
    created_at: string;
    prepared_time?: string;
    order_items?: MockOrderItem[];
}

export interface MockOrderItem {
    id: number;
    order_id: number;
    menu_item_name: string;
    quantity: number;
    price: number;
    special_instructions?: string;
}

export interface MockMenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    category_id: number;
    image_url?: string;
    status: 'approved' | 'pending';
    is_veg: boolean;
}

// Mock data storage
let currentUser: MockUser | null = null;
let orders: MockOrder[] = [];
let menuItems: MockMenuItem[] = [];
let orderIdCounter = 1;

// Initialize with dummy data
function initializeDummyData() {
    // Sample menu items
    menuItems = [
        {
            id: 1,
            name: 'Margherita Pizza',
            description: 'Classic cheese pizza',
            price: 299,
            category_id: 1,
            status: 'approved',
            is_veg: true,
        },
        {
            id: 2,
            name: 'Pepperoni Pizza',
            description: 'Spicy pepperoni',
            price: 399,
            category_id: 1,
            status: 'approved',
            is_veg: false,
        },
        {
            id: 3,
            name: 'Veggie Burger',
            description: 'Healthy vegetable burger',
            price: 199,
            category_id: 2,
            status: 'approved',
            is_veg: true,
        },
    ];

    // Sample orders
    const now = new Date();
    orders = [
        {
            id: 1,
            order_number: 'ORD001',
            table_id: 5,
            status: 'pending',
            total_amount: 698,
            customer_name: 'John Doe',
            created_at: now.toISOString(),
            order_items: [
                {
                    id: 1,
                    order_id: 1,
                    menu_item_name: 'Margherita Pizza',
                    quantity: 2,
                    price: 299,
                },
                {
                    id: 2,
                    order_id: 1,
                    menu_item_name: 'Veggie Burger',
                    quantity: 1,
                    price: 199,
                },
            ],
        },
        {
            id: 2,
            order_number: 'ORD002',
            table_id: 3,
            status: 'preparing',
            total_amount: 399,
            customer_name: 'Jane Smith',
            created_at: new Date(now.getTime() - 300000).toISOString(),
            order_items: [
                {
                    id: 3,
                    order_id: 2,
                    menu_item_name: 'Pepperoni Pizza',
                    quantity: 1,
                    price: 399,
                },
            ],
        },
    ];
    orderIdCounter = orders.length + 1;
}

initializeDummyData();

// Mock Database Class
class MockDatabase {
    // Subscribe to changes (simulated real-time)
    subscribe(table: string, callback: (payload: any) => void): string {
        console.log(`📡 Mock: Subscribed to ${table}`);
        // Return a mock subscription ID
        return `mock_subscription_${table}_${Date.now()}`;
    }

    unsubscribe(subscriptionId: string): void {
        console.log(`📡 Mock: Unsubscribed from ${subscriptionId}`);
    }

    // Query data
    async query(
        table: string,
        column: string,
        operator: string,
        value: any
    ): Promise<{ data: any[] | null; error: any }> {
        console.log(`🔍 Mock: Query ${table} WHERE ${column} ${operator} ${value}`);

        try {
            let results: any[] = [];

            if (table === 'orders') {
                results = orders.filter((order) => {
                    if (operator === 'eq') return (order as any)[column] === value;
                    if (operator === 'gte') return new Date((order as any)[column]) >= new Date(value);
                    if (operator === 'lte') return new Date((order as any)[column]) <= new Date(value);
                    return true;
                });
            } else if (table === 'menu_items') {
                results = menuItems;
            }

            return { data: results, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Update data
    async update(
        table: string,
        id: number,
        updates: any
    ): Promise<{ data: any | null; error: any }> {
        console.log(`✏️ Mock: Update ${table} #${id}`, updates);

        try {
            if (table === 'orders') {
                const index = orders.findIndex((o) => o.id === id);
                if (index !== -1) {
                    orders[index] = { ...orders[index], ...updates };
                    return { data: orders[index], error: null };
                }
            }
            return { data: null, error: { message: 'Not found' } };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Insert data
    async insert(table: string, data: any): Promise<{ data: any | null; error: any }> {
        console.log(`➕ Mock: Insert into ${table}`, data);

        try {
            if (table === 'orders') {
                const newOrder: MockOrder = {
                    id: orderIdCounter++,
                    order_number: `ORD${String(orderIdCounter).padStart(3, '0')}`,
                    ...data,
                    created_at: new Date().toISOString(),
                };
                orders.unshift(newOrder);
                return { data: newOrder, error: null };
            }
            return { data: null, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Delete data
    async delete(table: string, id: number): Promise<{ data: any | null; error: any }> {
        console.log(`🗑️ Mock: Delete from ${table} #${id}`);

        try {
            if (table === 'orders') {
                const index = orders.findIndex((o) => o.id === id);
                if (index !== -1) {
                    const deleted = orders.splice(index, 1)[0];
                    return { data: deleted, error: null };
                }
            }
            return { data: null, error: { message: 'Not found' } };
        } catch (error) {
            return { data: null, error };
        }
    }
}

// Mock Supabase Client
export const mockSupabase = {
    auth: {
        signInWithPassword: async ({
            email,
            password,
        }: {
            email: string;
            password: string;
        }) => {
            console.log('🔐 Mock: Sign in', email);

            // Mock users for testing
            const mockUsers: Record<string, MockUser> = {
                'owner@test.com': {
                    id: '1',
                    email: 'owner@test.com',
                    name: 'Owner User',
                    role: 'owner',
                    phone: '1234567890',
                    status: 'approved',
                },
                'manager@test.com': {
                    id: '2',
                    email: 'manager@test.com',
                    name: 'Manager User',
                    role: 'manager',
                    phone: '1234567890',
                    status: 'approved',
                },
                'chef@test.com': {
                    id: '3',
                    email: 'chef@test.com',
                    name: 'Chef User',
                    role: 'chef',
                    phone: '1234567890',
                    status: 'approved',
                },
            };

            const user = mockUsers[email];

            if (user && password === 'password') {
                currentUser = user;
                return {
                    data: {
                        user: { id: user.id, email: user.email },
                        session: { user: { id: user.id, email: user.email } },
                    },
                    error: null,
                };
            }

            return {
                data: { user: null, session: null },
                error: { message: 'Invalid credentials' },
            };
        },

        signOut: async () => {
            console.log('🚪 Mock: Sign out');
            currentUser = null;
            return { error: null };
        },

        getUser: async () => {
            return {
                data: {
                    user: currentUser
                        ? { id: currentUser.id, email: currentUser.email }
                        : null,
                },
                error: null,
            };
        },

        onAuthStateChange: (callback: (event: string, session: any) => void) => {
            console.log('👂 Mock: Auth state change listener registered');
            // Simulate initial session
            setTimeout(() => {
                callback('INITIAL_SESSION', currentUser ? { user: currentUser } : null);
            }, 100);

            return {
                data: {
                    subscription: {
                        unsubscribe: () => console.log('👂 Mock: Auth listener unsubscribed'),
                    },
                },
            };
        },
    },

    from: (table: string) => {
        return {
            select: (columns: string = '*') => {
                return {
                    eq: (column: string, value: any) => {
                        return {
                            maybeSingle: async () => {
                                if (table === 'users' && column === 'id') {
                                    return {
                                        data: currentUser,
                                        error: null,
                                    };
                                }
                                return { data: null, error: null };
                            },
                            single: async () => {
                                if (table === 'users' && column === 'id') {
                                    return {
                                        data: currentUser,
                                        error: currentUser ? null : { message: 'Not found' },
                                    };
                                }
                                return { data: null, error: { message: 'Not found' } };
                            },
                        };
                    },
                    in: (column: string, values: any[]) => {
                        return {
                            gte: (col: string, val: any) => {
                                return {
                                    lte: (c: string, v: any) => {
                                        return {
                                            order: (col: string, opts: any) => {
                                                const filtered = orders.filter((o) =>
                                                    values.includes((o as any)[column])
                                                );
                                                return Promise.resolve({ data: filtered, error: null });
                                            },
                                        };
                                    },
                                };
                            },
                        };
                    },
                    gte: (column: string, value: any) => {
                        return {
                            lte: (col: string, val: any) => {
                                return {
                                    order: (orderCol: string, opts: any) => {
                                        return Promise.resolve({ data: orders, error: null });
                                    },
                                };
                            },
                        };
                    },
                    order: (column: string, opts: any) => {
                        return {
                            limit: (count: number) => {
                                return Promise.resolve({ data: orders.slice(0, count), error: null });
                            },
                        };
                    },
                };
            },
            insert: (data: any) => {
                return {
                    select: () => {
                        return {
                            single: async () => {
                                return { data: null, error: null };
                            },
                        };
                    },
                };
            },
            upsert: (data: any, opts: any) => {
                return {
                    select: (cols: string) => {
                        return {
                            single: async () => {
                                return { data: currentUser, error: null };
                            },
                        };
                    },
                };
            },
        };
    },
};

export const database = new MockDatabase();
export const supabase = mockSupabase;
