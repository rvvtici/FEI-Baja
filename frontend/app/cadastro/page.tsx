'use client';

import { useState, useRef, useEffect } from 'react';
import { GeistSans } from "geist/font/sans";
import { inter } from '@/app/fonts';
import Image from 'next/image';
import { Input } from "@/components/ui/input"
import { Underline } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { registerUser } from "../../utils/auth";
import { register } from 'module';


export default function Cadastro() {

  const [user, setUser] = useState(""); //user -> identifier = email ou user
  const [senha, setSenha] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault()
    if(user==="" || senha==="" || email==="") {
      return
    } try {
      await registerUser(email, user, senha)
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
        Cadastro
      </h1>

      <h2 className="m-0">
        Estoque: FEI Baja
      </h2>
    </div>

    <form onSubmit={handleSubmit} className="flex flex-col items-end gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-muted-foreground">
          Email
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="unifbsouza@fei.edu.br"
          className="h-9"
          required
        />
      </div>

      <div className="flex-1">
        <label className="mb-1 block text-xs text-muted-foreground">
          Usuário
        </label>
        <Input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="unifbsouza"
          className="h-9"
          required
        />
      </div>

      <div className="flex-1">
        <label className="mb-1 block text-xs text-muted-foreground">
          Senha
        </label>
        <Input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="**********"
          className="h-9"
          required
        />
      </div>

      <Button
        type="submit"
        className="h-9 w-full rounded-lg"
      >
        Cadastrar
      </Button>
    </form>

      <a href="/login" className='text-[11px] m-1 text-muted-foreground text-right underline'>
        <p>
        Já possui conta? Acesse o login aqui
        </p>
      </a>
        
</main>
  );
}