'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GeistSans } from "geist/font/sans";
import type { IDetectedBarcode, IScannerHandle } from '@yudiel/react-qr-scanner';
import { useDevices } from '@yudiel/react-qr-scanner';
import { inter } from '@/app/fonts';
import Image from 'next/image';
import { Input } from "@/components/ui/input"
import { Underline } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  Boxes,
  CheckCircle2,
  Handshake,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  AlertTriangle,
  Minus
} from "lucide-react"

// Server-Side Rendering (SSR): This library requires browser APIs and will not work during SSR.
// Ensure you only import and use it in client-side code:
const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  { ssr: false }
);

// escolhe a câmera traseira principal (1x), evitando ultra-wide/macro
function useBestBackCamera(): string | undefined {
  const devices = useDevices(); // MediaDeviceInfo[]
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!devices || devices.length === 0) return;

    const isBack = (label: string) => /back|traseira|rear/i.test(label);
    const isUltraWideOrMacro = (label: string) =>
      /ultra ?wide|0\.5|macro|wide angle/i.test(label);

    const backCameras = devices.filter((d) => isBack(d.label));
    const mainBackCamera =
      backCameras.find((d) => !isUltraWideOrMacro(d.label)) ?? backCameras[0];

    if (mainBackCamera) {
      setDeviceId(mainBackCamera.deviceId);
    }
  }, [devices]);

  return deviceId;
}

export default function Home() {

const [isScanning, setIsScanning] = useState(false);
const [code, setCode] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
const [botaoAdicionar, setBotaoAdicionar] = useState(false);
const [botaoRemover, setBotaoRemover] = useState(false);
const [quantidadeDisponivel, setQuantidadeDisponivel] = useState(10);
const [quantidadeAdicaoRemocao, setQuantidadeAdicaoRemocao] = useState(0);
const [observacoes, setObservacoes] = useState("");
const quantidadeSoma = quantidadeDisponivel + quantidadeAdicaoRemocao;
const quantidadeSub = quantidadeDisponivel - quantidadeAdicaoRemocao;


const scannerRef = useRef<IScannerHandle>(null);
const deviceId = useBestBackCamera();

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
ref={scannerRef}
onScan={handleScan}
components={{
torch: true, // Show torch/flashlight button (if supported)
zoom: true, // Show zoom control (if supported)
            }}
onError={(err) => setError(String(err))}
constraints={
              deviceId
                ? { deviceId: { exact: deviceId } } // força a lente 1x especificamente
                : { facingMode: 'environment' } // fallback enquanto detecta as devices
            }
/>
<button
onClick={() => setIsScanning(false)}
className="mt-2 w-full rounded-lg border border-gray-300 bg-white text-black hover:bg-black hover:text-white px-4 py-2 transition"
>
    Cancelar
</button>
</div>
      )}



{/* display caso dê erro */}
{error && (
  <div className="mt-2 w-full max-w-[400px] rounded-lg bg-zinc-100 py-2 text-center text-green-800">
    <span className="font-semibold">Erro:</span>
    <p className="mt-1 break-all">{error}</p>
   </div>
)}


{/* display caso dê erro */}
{code && (
  <div>
    <div className="mt-2 w-full max-w-[400px] rounded-lg bg-red-100 px-40 py-2 text-center text-red-700">
      <span className="font-semibold">Código lido:</span>
      <p className="mt-1 break-all">{code}</p>
    </div>
    

    {/* informacoes do item */}
    <div className="mt-2 gap-2">
      {/* espeecificacoes item */}
      <div className="flex flex-col justify-center items-left p-2 rounded-lg text-black bg-zinc-300">
        <div className="flex flex-row gap-[1px]">
          <p className="font-bold">Código:</p><span/><p>teste</p>
        </div>
        
        <div className="flex flex-row gap-[1px]">
          <p className="font-bold">Nome:</p><span/><p>Fusível 10A</p>
        </div>
        
        <div className="flex flex-row gap-[1px]">
          <p className="font-bold">Categoria:</p><span/><p>Elétrica</p>
        </div>
        
        <div className="flex flex-row gap-[1px]">
          <p className="font-bold">Disponível:</p><span/><p>10</p>
        </div>
        
      </div>
        {/* if categoria = ferramenta: emprestar/devolver */}
        {/* else */}
        
        <div className="flex flex-col mb-16">


        {/* botoes */}
          <div className="">
            <Button onClick={() => {
                setBotaoAdicionar((prev) => !prev);
                setBotaoRemover(false); 
                setQuantidadeAdicaoRemocao(0);
              }} 
                className={`gap-2 p-9 text-white m-1 ${
                botaoAdicionar ? "bg-green-500" : "bg-green-800"
              }`}
              // className="gap-2 text-white bg-green-800"
              >
              <Plus className="h-4 w-4 text-white"/>
              Adicionar item
            </Button>

            <Button 
            onClick={() => {
                setBotaoRemover((prev) => !prev);
                setBotaoAdicionar(false); 
                setQuantidadeAdicaoRemocao(0);
              }} 
            className={`gap-2 p-9 text-white ${
              botaoRemover ? "bg-red-500" : "bg-red-800"
            }`}           
            >
            <Minus className="h-4 w-4 text-white" />
            Remover item
            </Button>
          </div>
        
          {(botaoAdicionar || botaoRemover) && (
            <div className="flex flex-col">

        <div className="flex flex-row"> 

            <p>Quantidade*:</p>
            {/* // nao permitir a qtde do input abaixo ser maior q a disponivel */}
            <Input
              id="adicionar-remover-item"
              type="number"
              value={quantidadeAdicaoRemocao}
              onChange={(e) => setQuantidadeAdicaoRemocao(Number(e.target.value))}
              // placeholder="Quantidade*:"
              className="h-7 mx-2 border-zinc-500"
              />

          </div>
          
        <div className="flex flex-row">
            <p>Observações:</p>
            <Input
              id="observacoes-adicao-remover-item"
              type="number"
              // value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              // placeholder="Quantidade*:"
              className="h-7 mx-2 border-zinc-500"
              />
            </div>
            </div>

          ) 
          }


{/* configurar aqui conexao c/ backend */}
          {botaoAdicionar && (
              <div className="flex justify-center items-center flex-col">
                <p>Nova quantidade: {quantidadeSoma}</p>
                <Button className="px-30">Confirmar</Button>
              </div>
            )
          }

          {botaoRemover && (
              <div className="flex justify-center items-center flex-col">
                <p>Nova quantidade: {quantidadeSub}</p>
                <Button className="px-30">Confirmar</Button>
              </div>
            )
          }

        

        </div>
    </div>
  </div>
      )}
</main>
  );
}