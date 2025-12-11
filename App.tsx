import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ShoppingCart, Package, UploadCloud, Menu, X, Pill, TrendingDown } from 'lucide-react';
import { Product, Transaction, AppView, PurchaseRecommendation } from './types';
import { INITIAL_PRODUCTS } from './constants';
import { generatePurchasePlan, updateStockFromTransaction, calculateReorderPoint } from './utils/inventoryLogic';
import FileUpload from './components/FileUpload';
import SawtoothChart from './components/SawtoothChart';

const App = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProductForChart, setSelectedProductForChart] = useState<Product | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    const savedTx = localStorage.getItem('transactions');
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedTx) setTransactions(JSON.parse(savedTx));
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [products, transactions]);

  const handleNewData = (newTransactions: Transaction[]) => {
    // 1. Add transactions
    const updatedTx = [...transactions, ...newTransactions];
    setTransactions(updatedTx);

    // 2. Update stock levels based on these new transactions
    let updatedProducts = [...products];
    newTransactions.forEach(tx => {
       updatedProducts = updateStockFromTransaction(updatedProducts, tx);
    });
    setProducts(updatedProducts);
  };

  const purchasePlan = useMemo(() => generatePurchasePlan(products), [products]);

  const stats = useMemo(() => {
    return {
      totalItems: products.length,
      lowStock: products.filter(p => p.currentStock <= p.minStock).length,
      criticalStock: products.filter(p => p.currentStock <= p.safetyStock).length,
      valueInStock: products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0)
    };
  }, [products]);

  const renderContent = () => {
    switch (view) {
      case AppView.DASHBOARD:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Geral</h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Total de Produtos</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalItems}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Estoque Crítico</p>
                <p className="text-3xl font-bold text-red-600">{stats.criticalStock}</p>
              </div>
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Abaixo do Mínimo</p>
                <p className="text-3xl font-bold text-orange-500">{stats.lowStock}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Valor em Estoque</p>
                <p className="text-3xl font-bold text-emerald-600">R$ {stats.valueInStock.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Quick Actions / Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                 <h3 className="text-lg font-semibold mb-4">Sugestão de Compra Hoje</h3>
                 {purchasePlan.length > 0 ? (
                   <ul className="divide-y divide-slate-100">
                     {purchasePlan.slice(0, 5).map(item => (
                       <li key={item.productId} className="py-3 flex justify-between items-center">
                         <div>
                           <p className="font-medium text-slate-800">{item.productName}</p>
                           <p className="text-xs text-slate-500">Atual: {item.currentStock} | Pedido: {item.reorderPoint}</p>
                         </div>
                         <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                           + {item.quantityToBuy} un
                         </span>
                       </li>
                     ))}
                     {purchasePlan.length > 5 && <li className="py-2 text-center text-sm text-blue-600 cursor-pointer" onClick={() => setView(AppView.PURCHASE)}>Ver todos...</li>}
                   </ul>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                     <CheckCircle className="w-8 h-8 mb-2" />
                     <p>Nenhuma compra necessária hoje.</p>
                   </div>
                 )}
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                  <h3 className="text-lg font-semibold mb-2">Atualizar Estoque</h3>
                  <p className="text-slate-500 mb-6 text-sm">Carregue os arquivos de vendas ou pedidos de hoje.</p>
                  <button 
                    onClick={() => setView(AppView.UPLOAD)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
                  >
                    <UploadCloud className="w-5 h-5 mr-2" />
                    Ir para Importação
                  </button>
               </div>
            </div>
          </div>
        );

      case AppView.UPLOAD:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Importação de Dados</h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col justify-center">
              <FileUpload 
                onDataParsed={handleNewData} 
                productNames={products.map(p => p.name)}
              />
            </div>
            {transactions.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold mb-4">Últimas Transações Processadas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold">
                      <tr>
                        <th className="px-4 py-2">Data</th>
                        <th className="px-4 py-2">Tipo</th>
                        <th className="px-4 py-2">Produto</th>
                        <th className="px-4 py-2 text-right">Qtd</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...transactions].reverse().slice(0, 10).map(tx => (
                        <tr key={tx.id}>
                          <td className="px-4 py-2">{tx.date}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${tx.type === 'SALE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {tx.type === 'SALE' ? 'VENDA' : 'ENTRADA'}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-medium">{tx.productId}</td>
                          <td className="px-4 py-2 text-right">{tx.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case AppView.PURCHASE:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Plano de Compras do Dia</h2>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                Exportar Pedido (PDF)
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
               <table className="w-full text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Produto</th>
                      <th className="px-6 py-4 text-center">Estoque Atual</th>
                      <th className="px-6 py-4 text-center">Ponto de Pedido</th>
                      <th className="px-6 py-4 text-right">Comprar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchasePlan.map(rec => (
                      <tr key={rec.productId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                           {rec.status === 'CRITICAL' ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                               Crítico
                             </span>
                           ) : (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                               Atenção
                             </span>
                           )}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">{rec.productName}</td>
                        <td className="px-6 py-4 text-center">{rec.currentStock}</td>
                        <td className="px-6 py-4 text-center">{rec.reorderPoint}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-bold text-blue-600">{rec.quantityToBuy}</span>
                        </td>
                      </tr>
                    ))}
                    {purchasePlan.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                          Tudo certo! Nenhuma compra necessária baseada nos parâmetros atuais.
                        </td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        );

      case AppView.INVENTORY:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Gerenciar Estoque (Parâmetros)</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product List */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700">Produto</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-center">Min / Seg / Max</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-center">Tempo Repo.</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedProductForChart(p)}>
                         <td className="px-4 py-3 font-medium">{p.name}</td>
                         <td className="px-4 py-3 text-center text-slate-500">
                           {p.minStock} / {p.safetyStock} / {p.maxStock}
                         </td>
                         <td className="px-4 py-3 text-center">{p.leadTimeDays} dias</td>
                         <td className="px-4 py-3 text-right">
                           <button className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Chart Panel */}
              <div className="lg:col-span-1 space-y-4">
                 {selectedProductForChart ? (
                   <SawtoothChart product={selectedProductForChart} transactions={transactions} />
                 ) : (
                   <div className="h-64 bg-white rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-center p-4">
                     Selecione um produto para visualizar o Gráfico Dente de Serra.
                   </div>
                 )}
                 
                 {selectedProductForChart && (
                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                     <h4 className="font-bold mb-2">Detalhes de Cálculo</h4>
                     <p>Ponto de Pedido: <strong>{calculateReorderPoint(selectedProductForChart)} un</strong></p>
                     <p className="mt-1 text-xs opacity-80">(Venda Média x Lead Time) + Estoque Segurança</p>
                   </div>
                 )}
              </div>
            </div>
          </div>
        );
    }
  };

  const CheckCircle = ({ className }: { className?: string }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  );
  const hasApiKey = !!import.meta.env.VITE_API_KEY;
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="text-blue-400" />
            <span className="text-xl font-bold tracking-tight">PharmaStock AI</span>
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}><X /></button>
        </div>
        
        <nav className="mt-6 px-4 space-y-2">
          <button 
            onClick={() => { setView(AppView.DASHBOARD); setSidebarOpen(false); }}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${view === AppView.DASHBOARD ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </button>
          
          <button 
             onClick={() => { setView(AppView.UPLOAD); setSidebarOpen(false); }}
             className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${view === AppView.UPLOAD ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <UploadCloud className="w-5 h-5 mr-3" />
            Importar Dados
          </button>

          <button 
             onClick={() => { setView(AppView.PURCHASE); setSidebarOpen(false); }}
             className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${view === AppView.PURCHASE ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            Sugestão de Compra
          </button>

          <button 
             onClick={() => { setView(AppView.INVENTORY); setSidebarOpen(false); }}
             className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${view === AppView.INVENTORY ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Package className="w-5 h-5 mr-3" />
            Estoque & Parâmetros
          </button>
        </nav>
        
        <div className="absolute bottom-6 left-0 w-full px-6">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Status API Gemini</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium">
                {hasApiKey ? 'Conectado' : 'Sem Chave API'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between md:hidden">
           <div className="flex items-center gap-2">
             <Pill className="text-blue-600 w-6 h-6" />
             <span className="font-bold text-slate-800">PharmaStock</span>
           </div>
           <button onClick={() => setSidebarOpen(true)} className="text-slate-600"><Menu /></button>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;