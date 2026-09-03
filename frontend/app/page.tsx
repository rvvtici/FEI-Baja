'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GeistSans } from "geist/font/sans";
import type { IDetectedBarcode, IScannerHandle } from '@yudiel/react-qr-scanner';
import { useDevices } from '@yudiel/react-qr-scanner';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

import { ItemMovimentForm } from "@/components/dashboards/principal/item-movimentation-card"
import { Item } from "@/components/types/types"

const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  { ssr: false }
);

function useBestBackCamera(): string | undefined {
  const devices = useDevices();
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!devices || devices.length === 0) return;

    const isBack = (label: string) => /back|traseira|rear/i.test(label);
    const isUltraWideOrMacro = (label: string) => /ultra ?wide|0\.5|macro|wide angle/i.test(label);

    const backCameras = devices.filter((d) => isBack(d.label));
    const mainBackCamera = backCameras.find((d) => !isUltraWideOrMacro(d.label)) ?? backCameras[0];

    if (mainBackCamera) {
      setDeviceId(mainBackCamera.deviceId);
    }
  }, [devices]);

  return deviceId;
}

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedItem, setScannedItem] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<IScannerHandle>(null);
  const deviceId = useBestBackCamera();

  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length > 0) {
      const rawCode = detectedCodes[0].rawValue;
      setIsScanning(false);
      setIsLoading(true);
      setError(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const resp = await fetch(`${apiUrl}/api/itens/?code=${rawCode}`);
        
        if (resp.ok) {
          const dados = await resp.json();
          const pecaExata = dados.find((item: Item) => item.code === rawCode);
          
          if (pecaExata) {
            setScannedItem(pecaExata); 
          } else {
            setError(`O código "${rawCode}" não está registrado no sistema.`);
          }
        } else {
          setError("Erro de comunicação com o servidor.");
        }
      } catch (err) {
        setError("Erro de rede. Verifique sua conexão ou IP.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetScanner = () => {
    setScannedItem(null);
    setError(null);
    setIsScanning(true);
  };

  return (
    <main className={`${GeistSans.className} antialiased flex min-h-screen flex-col items-center p-4 bg-black/95 text-white overflow-y-auto`}>
      
      <div className="w-full max-w-[400px] flex flex-col items-center mt-6 mb-8">
        <Image
          src="/fei-baja.png"
          width={80}
          height={80}
          className="block mb-4"
          alt="Logo FEI Baja"
          loading="eager"
        />
        <h1 className="text-xl font-bold text-center">Estoque: FEI Baja</h1>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Scanner Móvel de Peças
        </p>
        <a href="/dashboard" className="text-sm text-[#254EDb] underline mt-4 hover:text-white transition-colors">
          Acessar Painel Web
        </a>
      </div>

      <div className="w-full max-w-[400px] flex-1 flex flex-col justify-start items-center">
        
        {!isScanning && !scannedItem && !isLoading && !error && (
          <button
            onClick={resetScanner}
            className="w-full rounded-xl bg-white text-black p-4 font-semibold transition hover:bg-zinc-200 shadow-sm"
          >
            Abrir câmera e escanear
          </button>
        )}


       {isScanning && (
          <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-zinc-800 bg-black relative">
            
            <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
              <span className="bg-black/70 text-white px-4 py-1.5 rounded-full text-xs font-medium animate-pulse backdrop-blur-sm">
                Aguardando foco no código...
              </span>
            </div>

            <Scanner
              ref={scannerRef}
              onScan={handleScan}
              formats={['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8']}
              components={{ torch: true, zoom: true }}
              onError={(err) => setError(String(err))}
              constraints={
                deviceId
                  ? { deviceId: { exact: deviceId } }
                  : { facingMode: 'environment' } 
              }
            />
            <button
              onClick={() => setIsScanning(false)}
              className="w-full border-t border-zinc-800 bg-zinc-900 text-white p-4 font-medium hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8 gap-4 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#254EDb]" />
            <p className="text-sm">Buscando peça no sistema...</p>
          </div>
        )}

        {error && (
          <div className="w-full bg-red-950/50 border border-red-900 rounded-xl p-5 text-center flex flex-col gap-4">
            <div>
              <span className="font-bold text-red-500 block mb-1">Atenção</span>
              <p className="text-sm text-red-200">{error}</p>
            </div>
            <button
              onClick={resetScanner}
              className="bg-red-900 hover:bg-red-800 text-white p-3 rounded-lg text-sm font-semibold transition-colors"
            >
              Escanear Novamente
            </button>
          </div>
        )}

        {scannedItem && (
          <div className="w-full bg-background rounded-2xl border border-border overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <div className="p-4">
              <ItemMovimentForm 
                scannedItem={scannedItem} 
                onSuccessSave={() => setScannedItem(null)} 
              />
            </div>
            
            <button
              onClick={resetScanner}
              className="w-full border-t border-border bg-muted/30 text-muted-foreground p-4 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Cancelar e ler outro código
            </button>
          </div>
        )}
      </div>

    </main>
  );
}