// === INÍCIO ARQUIVO AJUSTADO: FileUpload.tsx ===
import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseFileWithGemini } from '../services/geminiService';
import { Transaction } from '../types';
// AJUSTE: lib para ler planilhas Excel e converter em CSV
import * as XLSX from 'xlsx';

interface Props {
  onDataParsed: (transactions: Transaction[]) => void;
  productNames: string[];
}

const FileUpload: React.FC<Props> = ({ onDataParsed, productNames }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // AJUSTE: função auxiliar para converter arquivo (não Excel) em Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = () => reject(reader.error);
    });
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setStatus(null);

    try {
      let base64Content: string;
      let mimeType: string;

      const lowerName = file.name.toLowerCase();
      const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

      if (isExcel) {
        // AJUSTE: leitura de planilha Excel e conversão para CSV (que o Gemini entende)
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Converte primeira aba em CSV
        const csv = XLSX.utils.sheet_to_csv(sheet);

        // Converte CSV (texto) para base64
        const encoder = new TextEncoder();
        const csvBytes = encoder.encode(csv);
        base64Content = btoa(String.fromCharCode(...csvBytes));

        // Forçamos um MIME suportado pelo Gemini
        mimeType = 'text/csv';
      } else {
        // CSV, TXT, PDF etc – mantemos a leitura em base64 normal
        base64Content = await fileToBase64(file);
        mimeType = file.type || 'text/plain';
      }

      // AJUSTE: nova assinatura do parseFileWithGemini, passando mimeType e nome do arquivo
      const transactions = await parseFileWithGemini({
        fileName: file.name,
        mimeType,
        fileContentBase64: base64Content,
        existingProductNames: productNames,
      });

      if (transactions.length > 0) {
        onDataParsed(transactions);
        setStatus({
          type: 'success',
          msg: `Sucesso! ${transactions.length} registros processados do arquivo "${file.name}".`
        });
      } else {
        setStatus({
          type: 'error',
          msg: 'A IA não encontrou transações válidas neste arquivo. ' +
               'Verifique se ele contém, pelo menos, as colunas: Data, Produto e Quantidade.'
        });
      }
    } catch (err: any) {
      console.error(err);

      const msg =
        typeof err?.message === 'string'
          ? err.message
          : 'Erro ao processar arquivo. Verifique se o formato é suportado e se o arquivo possui colunas de Data, Produto e Quantidade.';

      setStatus({
        type: 'error',
        msg,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-white'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input 
          type="file" 
          id="fileInput" 
          className="hidden" 
          onChange={handleChange} 
          accept=".csv,.xls,.xlsx,.pdf,.txt"
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">A IA está analisando seu arquivo...</p>
            <p className="text-slate-400 text-sm mt-2">Isso pode levar alguns segundos.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Carregar Arquivo Diário</h3>
            <p className="text-slate-500 mb-3 max-w-sm mx-auto">
              Arraste ou clique para enviar arquivos (XLS, CSV, PDF, TXT).
              A IA detectará automaticamente Vendas ou Pedidos.
            </p>

            {/* AJUSTE: dica sobre colunas mínimas necessárias */}
            <p className="text-slate-400 text-xs mb-4 max-w-md mx-auto">
              Dica: para melhor resultado, use uma planilha com cabeçalho e pelo menos as colunas
              <span className="font-semibold"> Data</span>, 
              <span className="font-semibold"> Produto</span> e 
              <span className="font-semibold"> Quantidade</span>. Linhas sem essas informações podem ser ignoradas pela IA.
            </p>

            <div className="flex gap-4 text-xs text-slate-400">
              <span className="flex items-center"><FileText size={12} className="mr-1"/> PDF</span>
              <span className="flex items-center"><FileText size={12} className="mr-1"/> Excel</span>
              <span className="flex items-center"><FileText size={12} className="mr-1"/> CSV</span>
            </div>
          </div>
        )}
      </div>

      {status && (
        <div className={`mt-4 p-4 rounded-lg flex items-start ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 mt-0.5" /> : <AlertCircle className="w-5 h-5 mr-3 mt-0.5" />}
          <div>
            <p className="font-medium">{status.type === 'success' ? 'Processado com Sucesso' : 'Erro no Processamento'}</p>
            <p className="text-sm opacity-90">{status.msg}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
// === FIM ARQUIVO AJUSTADO: FileUpload.tsx ===
