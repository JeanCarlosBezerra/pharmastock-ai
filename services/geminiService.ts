// === INÍCIO ARQUIVO AJUSTADO: geminiService.ts ===
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from '../types';

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY as string;

  if (!apiKey) {
    // AJUSTE: mensagem em português (erro não vai para tela, mas fica claro no log)
    throw new Error("Chave da API do Gemini não encontrada. Defina VITE_API_KEY nas variáveis de ambiente.");
  }

  return new GoogleGenAI({ apiKey });
};

// AJUSTE: nova assinatura para receber nome do arquivo + mimeType
type ParseFileParams = {
  fileName: string;
  mimeType: string;
  fileContentBase64: string;
  existingProductNames: string[];
};

export const parseFileWithGemini = async ({
  fileName,
  mimeType,
  fileContentBase64,
  existingProductNames,
}: ParseFileParams): Promise<Transaction[]> => {
  const ai = getAiClient();
  const modelId = "gemini-2.5-flash";

  // AJUSTE: prompt em português, explicando colunas básicas
  const contextPrompt = `
    Você é um assistente de lançamento de dados para um sistema de estoque de farmácia.

    O arquivo anexado (${fileName}) contém registros de VENDAS (saída de produtos) ou RECOMPRAS / COMPRAS (entrada de produtos).

    Seu objetivo é transformar o conteúdo em uma lista de transações estruturadas (JSON).
    Use a lista de produtos abaixo apenas como contexto para reconhecer nomes parecidos:
    ${existingProductNames.slice(0, 50).join(', ')}

    Regras importantes:
    - Considere idealmente uma linha por transação.
    - As colunas mínimas para uma linha ser considerada válida são:
      * Data da movimentação (ou pelo menos uma data geral do arquivo);
      * Nome do Produto (ou código/SKU);
      * Quantidade.
    - Se a linha não tiver produto OU quantidade, ignore essa linha.
    - Identifique se cada linha representa:
      * "SALE"  -> quando é saída / venda;
      * "RESTOCK" -> quando é entrada / compra / reposição.
    - Se a data não estiver explícita em cada linha, procure um cabeçalho com a data.
      Se ainda assim não encontrar, use a data de hoje: ${new Date().toISOString().split('T')[0]}.
    - Ignore cabeçalhos, linhas em branco, totais, rodapés ou textos explicativos.
    - Retorne SOMENTE um array JSON com objetos, sem texto extra.

    Estrutura de cada objeto JSON esperado:
    {
      "productId": "nome ou código do produto encontrado na linha",
      "date": "YYYY-MM-DD",
      "type": "SALE" ou "RESTOCK",
      "quantity": número
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [
            { text: contextPrompt },
            {
              inlineData: {
                mimeType: mimeType || 'text/plain',
                data: fileContentBase64
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING, description: "Nome do produto ou SKU encontrado" },
              date: { type: Type.STRING, description: "Data no formato YYYY-MM-DD" },
              type: { type: Type.STRING, enum: ["SALE", "RESTOCK"] },
              quantity: { type: Type.NUMBER }
            },
            required: ["productId", "quantity", "type"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text) as any[];

    return data.map((item, index) => ({
      id: `trans-${Date.now()}-${index}`,
      productId: item.productId,
      date: item.date || new Date().toISOString().split('T')[0],
      type: item.type as 'SALE' | 'RESTOCK',
      quantity: item.quantity
    }));

  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);

    const raw = String(error?.message || error || '');

    // AJUSTE: mensagens mais claras para o usuário final
    if (raw.includes("INVALID_ARGUMENT") || raw.includes("Unsupported MIME type")) {
      throw new Error(
        "Não foi possível interpretar o arquivo enviado. " +
        "Prefira arquivos CSV ou Excel (.xlsx) com cabeçalho e, no mínimo, as colunas: Data, Produto e Quantidade."
      );
    }

    throw new Error(
      "Falha ao processar o arquivo com a IA. Tente novamente em alguns instantes. " +
      "Se o erro persistir, revise o layout do arquivo (colunas Data, Produto e Quantidade)."
    );
  }
};
// === FIM ARQUIVO AJUSTADO: geminiService.ts ===
