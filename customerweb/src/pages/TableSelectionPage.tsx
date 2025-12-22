import { useState } from 'react';
import { Users, ChevronRight, RefreshCw } from 'lucide-react';
import { useAvailableTables } from '../hooks/useSupabase';
import { RestaurantTable } from '../types';

interface TableSelectionPageProps {
    onTableSelected: (tableId: number) => void;
    onBack: () => void;
}

export default function TableSelectionPage({ onTableSelected, onBack }: TableSelectionPageProps) {
    const { tables, loading, error, refetch } = useAvailableTables();
    const [selectedTable, setSelectedTable] = useState<number | null>(null);

    const handleContinue = () => {
        if (selectedTable !== null) {
            onTableSelected(selectedTable);
        }
    };

    return (
        <div className="min-h-screen bg-brand-darker py-6 pb-24">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8 pt-4">
                    <h1 className="text-3xl md:text-5xl font-bold font-serif text-brand-yellow mb-2">Select Your Table</h1>
                    <p className="text-gray-400">Choose an available table to continue</p>
                </div>

                <div className="bg-brand-dark rounded-3xl p-5 md:p-8 border border-white/5 shadow-2xl">
                    {/* Refresh Button */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white">Available Tables</h2>
                        <button
                            onClick={() => refetch()}
                            className="p-2 bg-brand-gray/50 hover:bg-brand-yellow/10 text-gray-400 hover:text-brand-yellow rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow mx-auto mb-4"></div>
                            <p className="text-gray-400">Loading tables...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-center py-12">
                            <p className="text-red-400 mb-2">Failed to load tables</p>
                            <p className="text-gray-500 text-sm mb-4">{error.message || 'Please try again'}</p>
                            <button
                                onClick={() => refetch()}
                                className="px-6 py-2 bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-yellow rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* No Tables Available */}
                    {!loading && !error && tables.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-brand-gray rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🪑</div>
                            <p className="text-gray-400 mb-2">No tables available</p>
                            <p className="text-gray-500 text-sm">Please check back in a moment</p>
                        </div>
                    )}

                    {/* Tables Grid */}
                    {!loading && !error && tables.length > 0 && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                                {tables.map((table: RestaurantTable) => (
                                    <button
                                        key={table.id}
                                        onClick={() => setSelectedTable(table.id)}
                                        className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 ${selectedTable === table.id
                                            ? 'bg-brand-yellow text-brand-darker border-brand-yellow shadow-lg shadow-brand-yellow/20 scale-105'
                                            : 'bg-brand-gray/50 text-white border-transparent hover:border-brand-yellow/30 hover:bg-brand-gray'
                                            }`}
                                    >
                                        <Users className="w-8 h-8" />
                                        <div>
                                            <p className="font-bold text-lg">Table {table.table_number}</p>
                                            {table.capacity && (
                                                <p className={`text-xs ${selectedTable === table.id ? 'text-brand-darker/70' : 'text-gray-400'}`}>
                                                    Seats {table.capacity}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4 border-t border-white/10">
                                <button
                                    onClick={onBack}
                                    className="flex-1 bg-brand-gray hover:bg-brand-gray/80 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300"
                                >
                                    Back to Menu
                                </button>
                                <button
                                    onClick={handleContinue}
                                    disabled={selectedTable === null}
                                    className={`flex-1 font-bold text-lg py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 ${selectedTable === null
                                        ? 'bg-brand-gray/50 text-gray-500 cursor-not-allowed'
                                        : 'bg-brand-yellow hover:bg-yellow-400 text-brand-darker transform hover:scale-[1.02] shadow-lg'
                                        }`}
                                >
                                    Continue to Payment
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
