'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { GeistSans } from "geist/font/sans";
import type { IDetectedBarcode, IScannerHandle } from '@yudiel/react-qr-scanner';
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

// estado do zoom
const [zoomSupported, setZoomSupported] = useState(false);
const [zoomRange, setZoomRange] = useState({ min: 1, max: 1, step: 0.1 });
const [zoom, setZoom] = useState(1);

const scannerRef = useRef<IScannerHandle>(null);

const handleScan = (detectedCodes: IDetectedBarcode[]) => {
if (detectedCodes.length > 0) {
setCode(detectedCodes[0].rawValue);
setIsScanning(false); // fecha a câmera após ler
    }
  };

// checa se o dispositivo/navegador suporta zoom óptico via track capabilities
const checkZoomCapability = useCallback(() => {
const stream = scannerRef.current?.getStream();
const track = stream?.getVideoTracks()[0];
if (!track) return;

const capabilities = track.getCapabilities?.() as any;

if (capabilities?.zoom) {
setZoomSupported(true);
setZoomRange({
        min: capabilities.zoom.min,
        max: capabilities.zoom.max,
        step: capabilities.zoom.step || 0.1,
      });
setZoom(capabilities.zoom.min);
    } else {
setZoomSupported(false);
    }
  }, []);

// aplica o zoom direto na track de vídeo
const handleZoomChange = async (value: number) => {
setZoom(value);
const stream = scannerRef.current?.getStream();
const track = stream?.getVideoTracks()[0];
if (!track) return;

try {
await track.applyConstraints({
        advanced: [{ zoom: value } as any],
      });
    } catch (err) {
console.error('Erro ao aplicar zoom:', err);
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
<div className="w-full max-w-[400px]" style={{ touchAction: 'none' }}>
<Scanner
ref={scannerRef}
onScan={handleScan}
components={{
torch: true, // Show torch/flashlight button (if supported)
zoom: false, // controle nativo desligado, usamos o slider customizado abaixo
            }}
onError={(err) => setError(String(err))}
constraints={{ facingMode: 'environment' }} //camera traseira
onCameraStart={checkZoomCapability}
/>

{/* slider de zoom customizado */}
{zoomSupported ? (
<div className="mt-2 flex items-center gap-2">
<span className="text-xs">🔍</span>
<input
type="range"
min={zoomRange.min}
max={zoomRange.max}
step={zoomRange.step}
value={zoom}
onChange={(e) => handleZoomChange(Number(e.target.value))}
className="w-full"
/>
<span className="text-xs w-10 text-right">{zoom.toFixed(1)}x</span>
</div>
          ) : (
<p className="mt-2 text-center text-xs text-gray-400">
              Zoom óptico não suportado neste dispositivo/navegador
</p>
          )}

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