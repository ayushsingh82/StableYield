'use client';

import React from 'react';
import MintCusdButton from '../components/MintCusdButton';

const MintCusdDemoPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-white mb-4">
                            cUSD Minting Demo
                        </h1>
                        <p className="text-xl text-gray-300">
                            Test the two-step minting process for cUSD stablecoins
                        </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 shadow-2xl">
                        <MintCusdButton onMintComplete={() => console.log('Minting completed!')} />
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-sm">
                            This demo shows the complete minting flow: USDC → cUSD
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MintCusdDemoPage;
