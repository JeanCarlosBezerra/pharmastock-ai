import { Product, Transaction, PurchaseRecommendation } from '../types';

/**
 * Calculates the Reorder Point (Ponto de Pedido)
 * Formula: (Avg Daily Sales * Lead Time) + Safety Stock
 */
export const calculateReorderPoint = (product: Product): number => {
  return Math.ceil((product.avgDailySales * product.leadTimeDays) + product.safetyStock);
};

/**
 * Calculates Quantity to Buy
 * Formula: Max Stock - Current Stock (if Current <= Reorder Point)
 */
export const calculateToBuy = (product: Product): number => {
  const rop = calculateReorderPoint(product);
  if (product.currentStock <= rop) {
    return Math.max(0, product.maxStock - product.currentStock);
  }
  return 0;
};

export const generatePurchasePlan = (products: Product[]): PurchaseRecommendation[] => {
  return products
    .map(p => {
      const rop = calculateReorderPoint(p);
      const qty = calculateToBuy(p);
      
      let status: 'CRITICAL' | 'WARNING' | 'OK' = 'OK';
      
      if (p.currentStock <= p.safetyStock) {
        status = 'CRITICAL';
      } else if (p.currentStock <= rop) {
        status = 'WARNING';
      }

      return {
        productId: p.id,
        productName: p.name,
        currentStock: p.currentStock,
        reorderPoint: rop,
        quantityToBuy: qty,
        status
      };
    })
    .filter(rec => rec.quantityToBuy > 0)
    .sort((a, b) => (a.status === 'CRITICAL' ? -1 : 1));
};

export const updateStockFromTransaction = (
  products: Product[], 
  transaction: Transaction
): Product[] => {
  return products.map(p => {
    // Simple string matching for demo purposes
    if (p.name.toLowerCase().includes(transaction.productId.toLowerCase()) || 
        p.sku === transaction.productId) {
      
      let newStock = p.currentStock;
      if (transaction.type === 'SALE') {
        newStock = Math.max(0, p.currentStock - transaction.quantity);
      } else {
        newStock = p.currentStock + transaction.quantity;
      }
      
      return { ...p, currentStock: newStock };
    }
    return p;
  });
};