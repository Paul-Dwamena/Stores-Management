import React from 'react';

const LoadingSpinner = ({ isLoading }) => {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/20 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white p-12 rounded-[2rem] shadow-2xl border border-slate-100 flex items-center justify-center animate-in zoom-in-95 duration-300">
                <div className="relative">
                    {/* Pulsing Glow */}
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                    
                    {/* Spinning Outer Ring */}
                    <div className="w-32 h-32 rounded-full border-[6px] border-emerald-50 border-t-emerald-500 animate-spin relative z-10"></div>
                    
                    {/* Centered Logo Box */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-xl">
                            <span className="text-4xl font-black italic">F</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
