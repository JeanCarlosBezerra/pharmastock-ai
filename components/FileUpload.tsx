import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseFileWithGemini } from '../services/geminiService';
import { Transaction } from '../types';

interface Props {
  onDataParsed: (transactions: Transaction[]) => void;
  productNames: string[];
}

const FileUpload: React.FC<Props> = ({ onDataParsed, productNames }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setStatus(null);
    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        // Strip the data:url prefix for Gemini
        const base64Content = base64Data.split(',')[1];
        
        const transactions = await parseFileWithGemini(file, base64Content, productNames);
        
        if (transactions.length > 0) {
          onDataParsed(transactions);
          setStatus({ type: 'success', msg: `Sucesso! ${transactions.length} registros processados do arquivo ${file.name}.` });
        } else {
          setStatus({ type: 'error', msg: "A IA não encontrou transações válidas neste arquivo." });
        }
        setIsProcessing(false);
      };
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: "Erro ao processar arquivo. Verifique se o formato é suportado." });
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
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Arraste ou clique para enviar arquivos (XLS, CSV, PDF, TXT).
              A IA detectará automaticamente Vendas ou Pedidos.
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