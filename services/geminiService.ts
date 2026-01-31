import { Member } from "../types";

// Serviço desativado temporariamente para manutenção e correção de build.
// A biblioteca @google/genai foi removida das dependências.

export const initializeChat = (members: Member[], userName?: string) => {
  console.log("IA (Gemini) está desativada para manutenção.");
  // No-op
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  console.warn("Tentativa de envio de mensagem com IA desativada.");
  return "🚧 O sistema de Inteligência Artificial está temporariamente desativado para manutenção técnica. Por favor, tente novamente mais tarde.";
};