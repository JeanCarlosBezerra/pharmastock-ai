import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    sku: 'PARA500',
    category: 'Analgesic',
    currentStock: 120,
    costPrice: 2.50,
    minStock: 50,
    maxStock: 500,
    safetyStock: 30,
    leadTimeDays: 2,
    avgDailySales: 15
  },
  {
    id: '2',
    name: 'Amoxicilina 875mg',
    sku: 'AMOX875',
    category: 'Antibiotic',
    currentStock: 40,
    costPrice: 12.00,
    minStock: 40, // Needs order soon
    maxStock: 200,
    safetyStock: 20,
    leadTimeDays: 4,
    avgDailySales: 8
  },
  {
    id: '3',
    name: 'Dipirona Sódica 1g',
    sku: 'DIP1G',
    category: 'Analgesic',
    currentStock: 15, // Critical
    costPrice: 3.20,
    minStock: 60,
    maxStock: 300,
    safetyStock: 25,
    leadTimeDays: 3,
    avgDailySales: 20
  },
  {
    id: '4',
    name: 'Loratadina 10mg',
    sku: 'LORA10',
    category: 'Antihistamine',
    currentStock: 180,
    costPrice: 4.50,
    minStock: 40,
    maxStock: 250,
    safetyStock: 20,
    leadTimeDays: 2,
    avgDailySales: 10
  },
  {
    id: '5',
    name: 'Omeprazol 20mg',
    sku: 'OME20',
    category: 'Gastric',
    currentStock: 300,
    costPrice: 5.00,
    minStock: 80,
    maxStock: 600,
    safetyStock: 50,
    leadTimeDays: 5,
    avgDailySales: 12
  }
];