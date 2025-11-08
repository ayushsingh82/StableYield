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
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const inter = Inter({ subsets: ['latin'] });

// Configure RainbowKit with our custom chains
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const transports = Object.fromEntries(
  chains.map((chain) => [chain.id, http(chain.rpcUrls.default.http[0])])
) as Record<number, ReturnType<typeof http>>;

if (!projectId) {
  console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Falling back to injected connector only.');
}

const config = projectId
  ? getDefaultConfig({
      appName: 'StableYield',
      projectId,
      chains,
      ssr: false,
      pollingInterval: rpcConfig.pollingInterval,
      autoConnect: true,
    })
  : createConfig({
      appName: 'StableYield',
      chains,
      ssr: false,
      pollingInterval: rpcConfig.pollingInterval,
      autoConnect: true,
      connectors: [
        injected({
          shimDisconnect: true,
        }),
      ],
      transports,
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