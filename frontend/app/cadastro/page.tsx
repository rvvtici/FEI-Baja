'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GeistSans } from "geist/font/sans";
import Image from 'next/image';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { registerUser } from "../../utils/auth";

export default function Cadastro() {
  const router = useRouter();

  const [user, setUser] = useState("");
  const [senha, setSenha] = useState("");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");

  const [erroEmail, setErroEmail] = useState("");
  const [erroUser, setErroUser] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [erroSobrenome, setErroSobrenome] = useState("");
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErroEmail("");
    setErroUser("");
    setErroSenha("");
    setErroGeral("");

    // validações locais
    let temErro = false;
    if (email.trim() === "") {
      setErroEmail("Informe seu e-mail.");
      temErro = true;
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErroEmail("E-mail inválido.");
      temErro = true;
    }
    if (user.trim() === "") {
      setErroUser("Informe um usuário.");
      temErro = true;
    } else if (user.includes("@")) {
      setErroUser("O usuário não pode conter @.");
      temErro = true;
    }
    if (nome.trim() === "") {
      setErroNome("Informe seu nome.");
      temErro = true;
    } if (sobrenome.trim() === "") {
      setErroSobrenome("Informe seu sobrenome.");
      temErro = true;
    }

    if (senha === "") {
      setErroSenha("Informe uma senha.");
      temErro = true;
    } else if (senha.length < 8) {
      setErroSenha("A senha deve ter pelo menos 8 caracteres.");
      temErro = true;
    }
    if (temErro) return;

    setCarregando(true);
    try {
      await registerUser(email.trim(), user.trim(), nome.trim(), sobrenome.trim(), senha);
      router.replace("/login");
    } catch (err: any) {
      const data = err.response?.data;

      if (err.response?.status === 400 && data) {
        // o DRF devolve { campo: ["mensagem", ...] }
        if (data.email) setErroEmail("Este e-mail já está em uso ou é inválido.");
        if (data.username) {
          const msg = String(data.username[0] ?? "");
          setErroUser(
            msg.includes("@") ? "O usuário não pode conter @." : "Este usuário já está em uso."
          );
        }
        if (data.first_name) setErroNome("Informe um nome válido.");
        if (data.last_name) setErroSobrenome("Informe um sobrenome válido.");
        if (data.password) setErroSenha(String(data.password[0]));

        if (!data.email && !data.username && !data.password) {
          setErroGeral("Dados inválidos. Confira os campos.");
        }
      } else if (!err.response) {
        setErroGeral("Não foi possível conectar ao servidor. Tente novamente.");
      } else {
        setErroGeral("Erro ao cadastrar. Tente novamente.");
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
        <h1 className="text-center text-2xl font-bold">Cadastro</h1>
        <h2 className="m-0">Estoque: FEI Baja</h2>
      </div>



      <form onSubmit={handleSubmit} noValidate className="flex flex-col items-end gap-2">
        
         <div className="grid w-full grid-cols-2 gap-2">
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">Nome</label>
      <Input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Bernardo"
        className="h-9"
      />
      {erroNome && <p className="mt-1 text-xs text-red-400">{erroNome}</p>}
    </div>

    <div>
      <label className="mb-1 block text-xs text-muted-foreground">Sobrenome</label>
      <Input
        value={sobrenome}
        onChange={(e) => setSobrenome(e.target.value)}
        placeholder="Souza"
        className="h-9"
      />
      {erroSobrenome && <p className="mt-1 text-xs text-red-400">{erroSobrenome}</p>}
    </div>
  </div>
        
        <div className="flex-1 w-full">
          <label className="mb-1 block text-xs text-muted-foreground">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="unifbsouza@fei.edu.br"
            className="h-9"
          />
          {erroEmail && <p className="mt-1 text-xs text-red-400">{erroEmail}</p>}
        </div>

        <div className="flex-1 w-full">
          <label className="mb-1 block text-xs text-muted-foreground">Usuário</label>
          <Input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="unifbsouza"
            className="h-9"
          />
          {erroUser && <p className="mt-1 text-xs text-red-400">{erroUser}</p>}
        </div>

        <div className="flex-1 w-full">
          <label className="mb-1 block text-xs text-muted-foreground">Senha</label>
          <Input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="**********"
            className="h-9"
          />
          {erroSenha && <p className="mt-1 text-xs text-red-400">{erroSenha}</p>}
        </div>

        {erroGeral && (
          <p className="w-full text-center text-xs text-red-400">{erroGeral}</p>
        )}

        <Button type="submit" disabled={carregando} className="h-9 w-full rounded-lg">
          {carregando ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </form>





      <a href="/login" className='text-[11px] m-1 text-muted-foreground text-right underline'>
        <p>Já possui conta? Acesse o login aqui</p>
      </a>
    </main>
  );
}