'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { GeistSans } from "geist/font/sans";
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { inter } from '@/app/fonts';
import Image from 'next/image';
import { Underline } from 'lucide-react';

// Server-Side Rendering (SSR): This library requires browser APIs and will not work during SSR.
// Ensure you only import and use it in client-side code:
const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  { ssr: false }
);

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length > 0) {
      setCode(detectedCodes[0].rawValue);
      setIsScanning(false); // fecha a câmera após ler
    }
  };

  return (
    <main className={`${GeistSans.className} antialiased flex min-h-screen flex-col
     items-center justify-center bg-black/95 text-white`}>
      <a href="/dashboard" className="underline">dashboard</a>
      <Image
        src="/fei-baja.png"
        width={100}
        height={100}
        className="block p-[1px]"
        alt="Logo FEI Baja"
        loading="eager"
      />

      <h1 className="text-center text-2xl font-bold">
        Estoque: FEI Baja
      </h1>

      <p className="text-center text-xs">
        Scanner de Código de Barras / QR Code
      </p>


      {/* qnd nao tiver a camera aberta, o botao de escanear aparece */}
      {!isScanning && ( 
        <button
          onClick={() => {
            setCode(null);
            setError(null);
            setIsScanning(true);
          }}
          className="rounded-xs bg-white text-black p-[5px] m-1 text-sm transition hover:bg-black hover:text-white"
        >
          Abrir câmera e escanear
        </button>
      )}

      {/* camera aberta */}
      {isScanning && (
        <div className="w-full max-w-[400px]">
          <Scanner
            onScan={handleScan}
            onError={(err) => setError(String(err))}
            constraints={{ facingMode: 'environment' }} //camera traseira
          />
          <button
            onClick={() => setIsScanning(false)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white text-black hover:bg-black hover:text-white px-4 py-2 transition"
          >
            Cancelar
          </button>
        </div>
      )}


      {/* display qnd código eh lido */}
      {code && (
        <div className="w-full max-w-[400px] rounded-lg bg-green-100 p-4 text-center text-green-800">
          <span className="font-semibold">Código lido:</span>
          <p className="mt-1 break-all">{code}</p>
        </div>
      )}

      {/* display caso dê erro */}
      {error && (
        <div className="mt-4 w-full max-w-[400px] rounded-lg bg-red-100 p-4 text-center text-red-700">
          <span className="font-semibold">Erro:</span>
          <p className="mt-1 break-all">{error}</p>
        </div>
      )}
    </main>
  );
}