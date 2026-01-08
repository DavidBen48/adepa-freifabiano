import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, User, Server, FileText, CheckCircle, UserCheck } from 'lucide-react';
import { Button } from '../components/Button';

interface SecurityPolicyViewProps {
  onBack: () => void;
}

export const SecurityPolicyView: React.FC<SecurityPolicyViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Header Policy */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <ShieldCheck className="text-royal-500" size={28} />
             <h1 className="text-xl font-bold tracking-tight">MEMBERS<span className="text-royal-500">.AI</span> <span className="text-slate-500 font-normal">| Segurança</span></h1>
           </div>
           <Button variant="ghost" onClick={onBack}>
             <ArrowLeft size={18} className="mr-2" />
             Voltar para o Início
           </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl">
          
          <div className="flex flex-col items-center mb-12 text-center">
             <div className="w-20 h-20 bg-royal-900/20 rounded-full flex items-center justify-center mb-6 border border-royal-900/50 shadow-[0_0_30px_rgba(65,105,225,0.15)]">
               <Lock className="text-royal-400" size={40} />
             </div>
             <h2 className="text-3xl font-bold text-white mb-2">Política de Segurança e Uso Restrito</h2>
             <p className="text-slate-400 max-w-xl">
               Este ambiente digital é protegido por protocolos rigorosos de conformidade e segurança. O acesso não autorizado é monitorado e sujeito a penalidades legais.
             </p>
          </div>

          <div className="space-y-10">
            {/* Section 1 - Autoria */}
            <section className="flex gap-6">
               <div className="flex-shrink-0 mt-1">
                 <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-slate-700">
                   <User className="text-royal-500" size={20} />
                 </div>
               </div>
               <div>
                 <h3 className="text-lg font-semibold text-white mb-2">Autoria e Propriedade Intelectual</h3>
                 <p className="text-slate-400 leading-relaxed text-sm text-justify">
                   O sistema <strong>Members.AI</strong> (produto da <strong>Ben.AI</strong>) foi desenvolvido e arquitetado por <strong>David Ben (CEO da Ben.AI)</strong>, com a finalidade exclusiva de atender às demandas administrativas e eclesiásticas da instituição religiosa ADEPA, localidade Frei Fabiano. Todos os direitos de código-fonte, interface e lógica de negócio são reservados.
                 </p>
               </div>
            </section>

            {/* Section 1.5 - Pessoas Autorizadas */}
            <section className="flex gap-6">
               <div className="flex-shrink-0 mt-1">
                 <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-slate-700">
                   <UserCheck className="text-royal-500" size={20} />
                 </div>
               </div>
               <div>
                 <h3 className="text-lg font-semibold text-white mb-2">Pessoas Autorizadas ao Uso do Sistema</h3>
                 <p className="text-slate-400 leading-relaxed text-sm text-justify">
                   Além do criador do software (para fins de manutenção técnica), apenas <strong>duas pessoas</strong> possuem credenciais autorizadas para acessar os dados dos membros cadastrados. Estes operadores foram devidamente treinados e orientados a jamais repassar o acesso ao sistema ou compartilhar os códigos de segurança do mesmo com terceiros. A empresa contratante segue rigorosamente os protocolos de proteção de dados, garantindo sigilo absoluto.
                 </p>
               </div>
            </section>

            {/* Section 2 */}
            <section className="flex gap-6">
               <div className="flex-shrink-0 mt-1">
                 <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-slate-700">
                   <Server className="text-royal-500" size={20} />
                 </div>
               </div>
               <div>
                 <h3 className="text-lg font-semibold text-white mb-2">Segurança de Dados e Infraestrutura</h3>
                 <p className="text-slate-400 leading-relaxed text-sm text-justify">
                   Utilizamos arquitetura de nuvem criptografada para armazenamento de dados. O sistema implementa <strong>RLS (Row Level Security)</strong> no banco de dados, garantindo que nenhuma informação sensível seja exposta publicamente. A comunicação entre o cliente e o servidor é protegida via protocolo HTTPS (TLS 1.3), prevenindo interceptação de dados (Man-in-the-Middle).
                 </p>
               </div>
            </section>

            {/* Section 3 */}
            <section className="flex gap-6">
               <div className="flex-shrink-0 mt-1">
                 <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-slate-700">
                   <ShieldCheck className="text-royal-500" size={20} />
                 </div>
               </div>
               <div>
                 <h3 className="text-lg font-semibold text-white mb-2">Proteção Contra Ameaças Cibernéticas</h3>
                 <p className="text-slate-400 leading-relaxed text-sm text-justify">
                   O sistema conta com camadas de proteção contra ataques de força bruta, injeção de SQL e XSS (Cross-Site Scripting). O acesso administrativo é restrito por chaves de autenticação privadas e monitoramento de logs de atividade. Tentativas de acesso não autorizadas são registradas para auditoria forense digital.
                 </p>
               </div>
            </section>

            {/* Section 4 */}
            <section className="flex gap-6">
               <div className="flex-shrink-0 mt-1">
                 <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-slate-700">
                   <FileText className="text-royal-500" size={20} />
                 </div>
               </div>
               <div>
                 <h3 className="text-lg font-semibold text-white mb-2">Conformidade e Privacidade (LGPD)</h3>
                 <p className="text-slate-400 leading-relaxed text-sm text-justify">
                   Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>, todas as informações cadastradas (CPF, RG, Data de Nascimento) são tratadas como dados sensíveis. O uso destes dados é estritamente limitado à gestão interna da instituição, sendo vedada sua comercialização, compartilhamento ou exposição a terceiros sem consentimento explícito.
                 </p>
               </div>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-royal-900/10 border border-royal-900/30 rounded-full text-royal-400 text-xs font-semibold tracking-wider uppercase">
              <CheckCircle size={14} />
              Ambiente Seguro Verificado
            </div>
            <p className="text-slate-600 text-xs mt-4">
              © 2026 Members.AI - Frei Fabiano. Todos os direitos reservados.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};