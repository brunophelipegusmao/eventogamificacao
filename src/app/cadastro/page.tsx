import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@base-ui/react";

export default function Cadastro() {
  return (
    <main className="flex flex-col items-center gap-8 sm:gap-10">
      <form>
        <FieldGroup>
          <FieldLegend className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">
            Preprados para o desafio? Inscreva-se e participe!
          </FieldLegend>
          <FieldDescription className="text-base sm:text-lg text-center text-muted-foreground">
            Precisamos saber um pouco sobre você. Preencha o formulário abaixo e
            perticipe.
          </FieldDescription>
          <FieldSet className="w-full max-w-2xl flex flex-col gap-4 sm:gap-6">
            <FieldGroup>
              <FieldLabel htmlfor="nome">Nome Completo</FieldLabel>
              <Input
                id="nome"
                type="text"
                placeholder="Digite seu nome completo"
              />

              <FieldLabel htmlfor="idade">Idade</FieldLabel>
              <Input id="idade" type="number" placeholder="Digite sua idade" />

              <FieldLabel htmlfor="email">Email</FieldLabel>
              <Input id="email" type="email" placeholder="Digite seu email" />

              <FieldLabel htmlfor="telefone">WhatsApp</FieldLabel>
              <Input
                id="telefone"
                type="tel"
                placeholder="Digite seu número de WhatsApp"
              />
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </main>
  );
}
