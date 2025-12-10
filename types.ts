export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  costPrice: number;
  
  // Sawtooth Configuration
  minStock: number; // Estoque Mínimo (computed or manual)
  maxStock: number; // Estoque Máximo
  safetyStock: number; // Estoque de Segurança
  leadTimeDays: number; // Tempo de Reposição (dias)
  avgDailySales: number; // Venda Média Diária
}

export interface Transaction {
  id: string;
  productId: string;
  date: string; // ISO Date YYYY-MM-DD
  type: 'SALE' | 'RESTOCK';
  quantity: number;
}

export interface PurchaseRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number; // Ponto de Pedido
  quantityToBuy: number;
  status: 'CRITICAL' | 'WARNING' | 'OK';
}

export interface ProcessingResult {
  success: boolean;
  message: string;
  transactions?: Transaction[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  UPLOAD = 'UPLOAD',
  PURCHASE = 'PURCHASE'
}