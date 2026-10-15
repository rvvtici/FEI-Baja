'use client';

import { useState, useRef, useEffect } from 'react';
import { GeistSans } from "geist/font/sans";
import { inter } from '@/app/fonts';
import Image from 'next/image';
import { Input } from "@/components/ui/input"
import { Underline } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { loginUser } from "../../utils/auth";
import { register } from 'module';

export default function Login() {

  const [identifier, setIdentifier] = useState(""); // -> identifier = email (unif@fei.edu;br) ou user (unif)
  const [senha, setSenha] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault()
    if(identifier==="" || senha==="") {
      return
    } try {
      await loginUser(identifier, senha)
      alert("foi")
    } catch(e) {
      alert("nao")
    }
  }


return (
  <main className={`${GeistSans.className} antialiased flex min-h-screen flex-col
  items-center justify-center bg-black/95 text-white`}>


      <Image
          src="/fei-baja.png"
          width={100}
          height={100}
          className="block p-[1px]"
          alt="Logo FEI Baja"
          loading="eager"
      />


    <div className="mb-2">

      <h1 className="text-center text-2xl font-bold">
        Login
      </h1>

      <h2 className="m-0">
        Estoque: FEI Baja
      </h2>
    </div>

    <form onSubmit={handleSubmit} className="flex flex-col items-end gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-muted-foreground">
          Usuário
        </label>
        <Input
          // id="novo-item"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          // onKeyDown={(e) => {
          //   if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) adicionarItem()
          // }}
          placeholder="unifbsouza"
          className="h-9"
        />
      </div>



      <div className="flex-1">
        <label className="mb-1 block text-xs text-muted-foreground">
          Senha
        </label>
        <Input
          // id="novo-item"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          // onKeyDown={(e) => {
          //   if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) adicionarItem()
          // }}
          placeholder="**********"
          className="h-9 text-sm"
        />
      </div>


      {/* <div className="flex-1"> */}
      {/* <Button type="button" size="icon" onClick={logar}  */}
      <Button
        type="submit"
        className="h-9 w-full rounded-lg"
      >
        Login
      </Button>
      {/* </div> */}





    </form>

      <a href="/cadastro" className='text-[11px] m-1 text-muted-foreground text-right underline'>
        <p>
        Sem conta? Cadastre-se aqui
        </p>
      </a>
        
</main>
  );
}