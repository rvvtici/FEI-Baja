'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GeistSans } from "geist/font/sans";
import Image from 'next/image';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { loginUser } from "../../utils/auth";
import axios from 'axios';

export default function Login() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState(""); // email ou username
  const [senha, setSenha] = useState("");

  const [erroIdentifier, setErroIdentifier] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const checar = async () => {
      try {
        await axios.get(`${API}/api/users/user-info/`, { withCredentials: true });
        router.replace("/dashboard");   // já está logado
      } catch (e: any) {
        if (e.response?.status === 401) {
          // access expirou: tenta renovar com o refresh
          try {
            await axios.post(`${API}/api/users/token/refresh/`, null, { withCredentials: true });
            router.replace("/dashboard");
            return;
          } catch {}
        }
        setVerificando(false);          // não está logado: mostra o formulário
      }
    };
    checar();
  }, [router]);

  if (verificando) return null;         // evita piscar o formulário (ou coloque um spinner)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // limpa erros anteriores
    setErroIdentifier("");
    setErroSenha("");
    setErroGeral("");

    // validações locais
    let temErro = false;
    if (identifier.trim() === "") {
      setErroIdentifier("Informe seu usuário ou e-mail.");
      temErro = true;
    }
    if (senha === "") {
      setErroSenha("Informe sua senha.");
      temErro = true;
    }
    if (temErro) return;

    setCarregando(true);
    try {
      await loginUser(identifier.trim(), senha);
      router.replace("/dashboard");
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 400) {
        // o backend retorna 400 com "Credenciais incorretas"
        setErroGeral("Usuário ou senha incorretos.");
      } else if (!err.response) {
        setErroGeral("Não foi possível conectar ao servidor. Tente novamente.");
      } else {
        setErroGeral("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  };

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
        <h1 className="text-center text-2xl font-bold">Login</h1>
        <h2 className="m-0">Estoque: FEI Baja</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col items-end gap-2">
        <div className="flex-1 w-full">
          <label className="mb-1 block text-xs text-muted-foreground">
            Usuário
          </label>
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="unifbsouza"
            className="h-9"
          />
          {erroIdentifier && (
            <p className="mt-1 text-xs text-red-400">{erroIdentifier}</p>
          )}
        </div>

        <div className="flex-1 w-full">
          <label className="mb-1 block text-xs text-muted-foreground">
            Senha
          </label>
          <Input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="**********"
            className="h-9 text-sm"
          />
          {erroSenha && (
            <p className="mt-1 text-xs text-red-400">{erroSenha}</p>
          )}
        </div>

        {erroGeral && (
          <p className="w-full text-center text-xs text-red-400">{erroGeral}</p>
        )}

        <Button
          type="submit"
          disabled={carregando}
          className="h-9 w-full rounded-lg"
        >
          {carregando ? "Entrando..." : "Login"}
        </Button>
      </form>

      <a href="/cadastro" className='text-[11px] m-1 text-muted-foreground text-right underline'>
        <p>Sem conta? Cadastre-se aqui</p>
      </a>
    </main>
  );
}