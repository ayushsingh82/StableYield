'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from './components/Navbar';
import { rpcConfig, chains } from '../config';

// Rainbow Kit imports
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const inter = Inter({ subsets: ['latin'] });

// Configure RainbowKit with our custom chains
const config = getDefaultConfig({
  appName: 'StableCORE',
  projectId: 'YOUR_PROJECT_ID',
  chains: chains,
  ssr: true,
  pollingInterval: rpcConfig.pollingInterval,
});

// Create a client
const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <div className="min-h-screen bg-black">
                <Navbar />
                {children}
              </div>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}