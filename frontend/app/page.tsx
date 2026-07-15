'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner';

// Importa o Scanner dinamicamente, sem SSR, pois ele usa APIs do navegador (câmera)
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
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      <h1>Scanner de Código de Barras / QR Code</h1>

      {!isScanning && (
        <button
          onClick={() => {
            setCode(null);
            setError(null);
            setIsScanning(true);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            borderRadius: '8px',
            border: 'none',
            background: '#0070f3',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Abrir câmera e escanear
        </button>
      )}

      {isScanning && (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <Scanner
            onScan={handleScan}
            onError={(err) => setError(String(err))}
            constraints={{ facingMode: 'environment' }}
            components={{
              finder: true,
              torch: true,
            }}
          />
          <button
            onClick={() => setIsScanning(false)}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              background: '#fff',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {code && <p>Código lido: {code}</p>}

      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          Erro: {error}
        </div>
      )}
    </main>
  );
}