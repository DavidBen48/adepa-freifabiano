import { GoogleGenAI, Chat } from "@google/genai";
import { Member } from "../types";

let chatSession: Chat | null = null;
let ai: GoogleGenAI | null = null;

// Lazy initialization to prevent top-level crashes
const getAi = () => {
  if (!ai) {
    // Ensure we don't crash if env is missing; polyfill should handle it, but fallback string ensures constructor doesn't throw empty error immediately
    const apiKey = process.env.API_KEY || 'MISSING_KEY';
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const initializeChat = (members: Member[], userName?: string) => {
  try {
    const model = getAi();
    
    // We feed the member data into the system instruction for context-aware answers
    const memberDataJSON = JSON.stringify(members.map(m => ({
      nome: m.fullName,
      funcao: m.role,
      nascimento: m.birthDate,
      batismo: m.baptismDate,
      localidade: m.locality,
      cpf_parcial: m.cpf && m.cpf.length >= 11 ? `***.${m.cpf.slice(4,7)}.${m.cpf.slice(8,11)}-**` : 'N/A'
    })));

    const memberContext = members.length > 0 
      ? `BASE DE DADOS ATUALIZADA DOS MEMBROS (JSON): ${memberDataJSON}`
      : "Não há membros cadastrados ainda.";

    const systemInstruction = `
      Você é o **FREI.ai**, a Inteligência Artificial Avançada da instituição ADEPA - Localidade Frei Fabiano.
      
      ESTÁ FALANDO COM: ${userName || 'Administrador não identificado'} (Trate a pessoa pelo nome sempre que possível).

      SEU OBJETIVO:
      Atuar como um analista de dados e assistente teológico. Você tem acesso total aos dados dos membros listados no contexto e deve ser capaz de cruzar informações, gerar relatórios rápidos e responder dúvidas complexas.

      CAPACIDADES DE ANÁLISE (Exemplos do que você deve ser capaz de fazer):
      - Filtragem: "Quem são os membros que começam com a letra A?", "Listar todos os Diáconos".
      - Contagem: "Quantos membros temos no total?", "Quantos pastores existem?".
      - Cruzamento: "Existem membros com o mesmo sobrenome?", "Quem se batizou antes de 2000?".
      - Aniversariantes: Verificar datas de nascimento (considere a data atual como sendo a data real de hoje).

      DIRETRIZES DE PERSONALIDADE:
      1. **Identidade**: Você é o FREI.ai. Sério, profissional, extremamente educado e eficiente.
      2. **Saudação**: Se souber o nome (Laryssa ou Nilda), use-o. Ex: "Olá, Laryssa. Em que posso ajudar na gestão hoje?".
      3. **Privacidade**: Nunca exponha dados sensíveis (CPF completo) em respostas de texto, use os dados mascarados ou apenas confirme que tem o dado.
      4. **Teologia**: Para dúvidas bíblicas, seja ortodoxo e use a busca (Google Search) para referências precisas se necessário.

      CONTEXTO DE DADOS:
      ${memberContext}
    `;

    chatSession = model.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 1024 }, // Basic thinking for logic
        tools: [{ googleSearch: {} }] // Grounding for theological/news questions
      }
    });
  } catch (error) {
    console.error("Failed to initialize chat session:", error);
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const model = getAi();
    
    if (!chatSession) {
      // Fallback if chat wasn't initialized with data yet
      chatSession = model.chats.create({
          model: 'gemini-3-pro-preview',
          config: { 
              tools: [{ googleSearch: {} }] 
          }
      });
    }

    const response = await chatSession.sendMessage({ message });
    return response.text || "Desculpe, não consegui processar a resposta.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro ao comunicar com o FREI.ai. Verifique se a chave API está configurada.";
  }
};