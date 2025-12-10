import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Product, Transaction } from '../types';

interface Props {
  product: Product;
  transactions: Transaction[];
}

const SawtoothChart: React.FC<Props> = ({ product, transactions }) => {
  const chartData = useMemo(() => {
    // Filter transactions for this product
    const relevantTx = transactions
      .filter(t => t.productId === product.id || product.name.toLowerCase().includes(t.productId.toLowerCase()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Generate a daily timeline for the last 30 days + next 7 days projection
    const dataPoints = [];
    const today = new Date();
    let simulatedStock = product.currentStock;
    
    // Backtrack to build history (simplified for visual demo)
    // In a real app, we'd have daily snapshots. Here we simulate backwards from current stock.
    const historyDays = 15;
    
    // Create past dates
    for (let i = historyDays; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Find transactions on this day (mock logic: real logic requires snapshot history)
        // Ideally, we start from a known past point.
        // For this visual, we will just plot the levels defined by parameters to show the "Sawtooth" shape concept
        // rather than accurate history reconstruction which is complex without snapshots.
        
        // Let's create a theoretical sawtooth pattern based on usage
        const daysInCycle = Math.floor(product.maxStock / product.avgDailySales);
        const cycleDay = i % daysInCycle;
        const projectedStock = product.maxStock - (cycleDay * product.avgDailySales);
        
        dataPoints.push({
            date: dateStr,
            stock: projectedStock > 0 ? projectedStock : 0,
            min: product.minStock,
            max: product.maxStock,
            safety: product.safetyStock
        });
    }

    return dataPoints;
  }, [product, transactions]);

  return (
    <div className="h-64 w-full bg-white p-4 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Gráfico Dente de Serra (Simulação Teórica): {product.name}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" fontSize={10} tickFormatter={(val) => val.slice(5)} />
          <YAxis fontSize={10} />
          <Tooltip contentStyle={{ fontSize: '12px' }} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          
          <ReferenceLine y={product.maxStock} label="Máx" stroke="#10b981" strokeDasharray="3 3" />
          <ReferenceLine y={product.minStock} label="Min (Pedido)" stroke="#f59e0b" strokeDasharray="3 3" />
          <ReferenceLine y={product.safetyStock} label="Segurança" stroke="#ef4444" strokeDasharray="3 3" />

          <Line 
            type="monotone" 
            dataKey="stock" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            name="Nível de Estoque"
            dot={{ r: 2 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SawtoothChart;