'use client';

import { useState, useRef, useEffect } from 'react';
import { GeistSans } from "geist/font/sans";
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

export default function Login() {

const [user, setUser] = useState("");
const [senha, setSenha] = useState("");

function logar() {
  console.log(user, senha);
}


return (
<main className={`${GeistSans.className} antialiased flex min-h-screen flex-col
     items-center justify-center bg-black/95 text-white`}>

    {/* <span>

      <a href="/dashboard" className="underline">dashboard</a>
      <a></a>
    </span> */}


    <Image
        src="/fei-baja.png"
        width={100}
        height={100}
        className="block p-[1px]"
        alt="Logo FEI Baja"
        loading="eager"
    />

    <h1 className="text-center text-2xl font-bold">
      Login
    </h1>

    <h2>
      Estoque: FEI Baja
    </h2>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-muted-foreground">
                      User/email
                    </label>
                    <Input
                      // id="novo-item"
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      // onKeyDown={(e) => {
                      //   if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) adicionarItem()
                      // }}
                      placeholder="user@fei.edu.br"
                      className="h-9"
                    />
                  </div>



                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Senha
                    </label>
                    <Input
                      // id="novo-item"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      // onKeyDown={(e) => {
                      //   if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) adicionarItem()
                      // }}
                      placeholder="********"
                      className="h-9"
                    />
                  </div>


                  {/* <div className="flex-1"> */}
                  <Button type="button" size="icon" onClick={logar} 
                  className= "h-8 w-full min-w-0 rounder-lg px-2.5 py-1 text-base hover:cursor-pointer" 
                    // "h-8 w-full min-w-0 rounded-lg border border-input px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                  >
                    {/* <Plus className="h-4 w-4" /> */}
                    <p className="p-4 m-4">Login</p>
                    {/* <span className="sr-only">Adicionar item</span> */}
                  </Button>
                  {/* </div> */}



                </div>


        
</main>
  );
}