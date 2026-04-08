"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth-guards";
import { 
  startOfDay, 
  endOfDay, 
  eachDayOfInterval, 
  format, 
  startOfMonth, 
  subDays 
} from "date-fns";

export async function getSalesReport(from?: string, to?: string) {
  await requireAdminUser();
  
  const now = new Date();
  const startDate = from ? startOfDay(new Date(from)) : startOfMonth(now);
  const endDate = to ? endOfDay(new Date(to)) : endOfDay(now);

  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      items: true
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Daily revenue aggregation
  const dailyMap: Record<string, number> = {};
  orders.forEach((order) => {
    const day = format(order.createdAt, "yyyy-MM-dd");
    dailyMap[day] = (dailyMap[day] || 0) + Number(order.totalAmount);
  });

  const dailyChart = eachDayOfInterval({ start: startDate, end: endDate }).map((date) => {
    const day = format(date, "yyyy-MM-dd");
    return {
      name: format(date, "dd/MM"),
      value: dailyMap[day] || 0,
    };
  });

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalOrders = orders.length;

  return { dailyChart, totalRevenue, totalOrders };
}

export async function getInventoryReport() {
  await requireAdminUser();

  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
  });

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock < 10);
  const outOfStock = products.filter(p => p.stock === 0);

  // Category distribution
  const categoryMap: Record<string, number> = {};
  products.forEach(p => {
    const cat = p.category.name;
    categoryMap[cat] = (categoryMap[cat] || 0) + p.stock;
  });

  const categoryChart = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    summary: {
      totalProducts: products.length,
      totalStock,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
    },
    categoryChart,
    lowStockItems: lowStock.map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      category: p.category.name,
    })),
  };
}

export async function getShippingReport(from?: string, to?: string) {
  await requireAdminUser();
  
  const startDate = from ? startOfDay(new Date(from)) : subDays(new Date(), 30);
  const endDate = to ? endOfDay(new Date(to)) : endOfDay(new Date());

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      deliveryStatus: true,
      createdAt: true,
    },
  });

  const statusMap: Record<string, number> = {
    PENDING: 0,
    PACKAGING: 0,
    SHIPPED: 0,
    RECEIVED: 0,
  };

  orders.forEach(o => {
    statusMap[o.deliveryStatus]++;
  });

  const statusChart = [
    { name: "Pendiente", value: statusMap.PENDING, color: "#94a3b8" },
    { name: "Empacando", value: statusMap.PACKAGING, color: "#f59e0b" },
    { name: "Enviado", value: statusMap.SHIPPED, color: "#3b82f6" },
    { name: "Recibido", value: statusMap.RECEIVED, color: "#10b981" },
  ].filter(s => s.value > 0);

  return {
    statusChart,
    total: orders.length,
  };
}

export async function getCustomerReport(from?: string, to?: string) {
  await requireAdminUser();
  
  const startDate = from ? startOfDay(new Date(from)) : subDays(new Date(), 90);
  const endDate = to ? endOfDay(new Date(to)) : endOfDay(new Date());

  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const customerMap: Record<string, { name: string, email: string, orders: number, spent: number }> = {};

  orders.forEach(o => {
    const key = o.customerEmail;
    if (!customerMap[key]) {
      customerMap[key] = {
        name: o.user?.name || "Invitado",
        email: o.customerEmail,
        orders: 0,
        spent: 0,
      };
    }
    customerMap[key].orders++;
    customerMap[key].spent += Number(o.totalAmount);
  });

  return Object.values(customerMap)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10);
}

export async function getTopSellingProducts(from?: string, to?: string) {
  await requireAdminUser();
  
  const startDate = from ? startOfDay(new Date(from)) : startOfMonth(new Date());
  const endDate = to ? endOfDay(new Date(to)) : endOfDay(new Date());

  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        status: "PAID",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    include: {
      product: {
        select: {
          name: true,
        },
      },
    },
  });

  const productMap: Record<string, { name: string, quantity: number, revenue: number }> = {};
  items.forEach(item => {
    if (!productMap[item.productId]) {
      productMap[item.productId] = { name: item.product.name, quantity: 0, revenue: 0 };
    }
    productMap[item.productId].quantity += item.quantity;
    productMap[item.productId].revenue += item.quantity * Number(item.price);
  });

  return Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
}
