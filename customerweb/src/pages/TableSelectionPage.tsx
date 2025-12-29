import { useState } from 'react';
import { Users, ChevronRight, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAvailableTables } from '../hooks/useSupabase';
import { RestaurantTable } from '../types';
import { Button, Card, LoadingSpinner, Alert } from '../components';

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

    if (loading) {
        return <LoadingSpinner fullScreen message="Finding the perfect table for you..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-brand-darker via-brand-dark to-brand-darker py-8 pb-24">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Header Section */}
                <div className="mb-8 md:mb-12 animate-fade-in-down">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-yellow transition-colors mb-6 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Menu
                    </button>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-serif text-white mb-3">
                        Select Your <span className="text-brand-yellow">Table</span>
                    </h1>
                    <p className="text-gray-400 text-sm md:text-lg">Choose a comfortable seating for your dining experience</p>
                </div>

                {/* Error State */}
                {error && (
                    <Alert
                        type="error"
                        title="Failed to Load Tables"
                        message={error.message || 'Please try again'}
                        dismissible
                        onClose={() => refetch()}
                    />
                )}

                {/* Main Content Card */}
                <Card glowing className="p-4 md:p-12 animate-fade-in-up">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 md:mb-8 pb-4 md:pb-6 border-b border-white/10">
                        <h2 className="text-xl md:text-3xl font-bold text-white">Available Tables</h2>
                        <button
                            onClick={() => refetch()}
                            className="p-3 bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-yellow rounded-xl transition-all hover:scale-110 duration-300"
                            title="Refresh table list"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>

                    {/* No Tables Available */}
                    {!loading && tables.length === 0 && !error && (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-brand-gray rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                                🪑
                            </div>
                            <p className="text-gray-400 text-xl font-medium mb-2">No tables available</p>
                            <p className="text-gray-500 mb-6">Please check back in a moment</p>
                            <Button
                                onClick={() => refetch()}
                                variant="ghost"
                                icon={<RefreshCw className="w-4 h-4" />}
                            >
                                Refresh
                            </Button>
                        </div>
                    )}

                    {/* Tables Grid */}
                    {!loading && tables.length > 0 && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                                {tables.map((table: RestaurantTable, index: number) => (
                                    <button
                                        key={table.id}
                                        onClick={() => setSelectedTable(table.id)}
                                        className={`p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 animate-fade-in-up`}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div
                                            className={`w-full h-full absolute inset-0 rounded-2xl border-2 transition-all duration-300 ${selectedTable === table.id
                                                ? 'bg-brand-yellow/20 border-brand-yellow shadow-lg shadow-brand-yellow/30 scale-110'
                                                : 'bg-brand-gray/30 border-transparent hover:border-brand-yellow/50 hover:bg-brand-gray/50'
                                                }`}
                                        />
                                        <div className="relative z-10 flex flex-col items-center gap-2">
                                            <div
                                                className={`p-3 rounded-xl transition-all ${selectedTable === table.id
                                                    ? 'bg-brand-yellow/20 text-brand-yellow'
                                                    : 'bg-brand-yellow/10 text-gray-300 group-hover:text-brand-yellow'
                                                    }`}
                                            >
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div className="text-center">
                                                <p
                                                    className={`font-bold text-lg transition-colors ${selectedTable === table.id ? 'text-brand-yellow' : 'text-white'
                                                        }`}
                                                >
                                                    Table {table.table_number}
                                                </p>
                                                {table.capacity && (
                                                    <p
                                                        className={`text-xs font-medium ${selectedTable === table.id ? 'text-brand-yellow/70' : 'text-gray-400'
                                                            }`}
                                                    >
                                                        {table.capacity} seats
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-8 border-t border-white/10">
                                <Button
                                    onClick={onBack}
                                    variant="secondary"
                                    size="lg"
                                    fullWidth
                                    icon={<ArrowLeft className="w-5 h-5" />}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleContinue}
                                    disabled={selectedTable === null}
                                    size="lg"
                                    fullWidth
                                    icon={<ChevronRight className="w-5 h-5" />}
                                    iconPosition="right"
                                    className="shadow-lg shadow-brand-yellow/20"
                                >
                                    Continue
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
