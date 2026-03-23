"use server";

import { prisma } from "@/lib/prisma";
import { CartItem } from "@/lib/store";
import { DeliveryStatus, Prisma } from "@prisma/client";
import { signIn, signOut, auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { sendDeliveryStatusEmail, sendOrderConfirmationEmail } from "@/lib/order-email";

const CART_EXPIRATION_MS = 15 * 60 * 1000;

function hasCartTablesInClient() {
  const p = prisma as unknown as {
    cart?: { findUnique?: unknown; upsert?: unknown };
    cartEntry?: { upsert?: unknown };
  };
  return (
    typeof p.cart?.findUnique === "function" &&
    typeof p.cart?.upsert === "function" &&
    typeof p.cartEntry?.upsert === "function"
  );
}

async function getOrderEmailPayload(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}

function revalidateOrderPaths(orderId: string) {
  revalidatePath(`/track/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/admin/orders");
}

async function requireAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  return session;
}

async function requireAdminUser() {
  const session = await requireAuthenticatedUser();

  if (session.user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }

  return session;
}

// ========== ORDER ACTIONS ==========
export async function createOrder(
  cartItems: CartItem[],
  paypalOrderId: string,
  customerEmail: string
) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const order = await prisma.$transaction(async (tx) => {
      let calculatedTotal = 0;
      const orderItemsData = [];

      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.id },
        });

        if (!product) {
          throw new Error(`Producto no encontrado: ${item.name}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para: ${product.name}`);
        }

        const itemTotal = Number(product.price) * item.quantity;
        calculatedTotal += itemTotal;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          paypalOrderId,
          customerEmail,
          totalAmount: new Prisma.Decimal(calculatedTotal),
          status: "PAID",
          deliveryStatus: "PENDING",
          userId,
          items: {
            create: orderItemsData,
          },
        },
      });

      return newOrder;
    });

    const orderForEmail = await getOrderEmailPayload(order.id);
    if (orderForEmail) {
      try {
        await sendOrderConfirmationEmail(orderForEmail);
      } catch (emailError) {
        console.error("Order email failed:", emailError);
      }
    }

    revalidateOrderPaths(order.id);

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Transaction Failed:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

// ========== USER ORDERS ==========
export async function getUserOrders() {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "No autenticado", orders: [] };
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, image: true, slug: true },
            },
          },
        },
      },
    });

    return { success: true, orders };
  } catch {
    return { success: false, error: "Error al obtener pedidos", orders: [] };
  }
}

// ========== AUTH ACTIONS ==========
export async function login(formData: FormData): Promise<void> {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    redirect("/auth/login?error=missing");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/auth/login?error=invalid");
    }
    throw error;
  }
  redirect("/");
}

export async function register(formData: FormData): Promise<void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!name || !email || !password) {
    redirect("/auth/register?error=missing");
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    redirect("/auth/register?error=email");
  }

  if (password.length < 6) {
    redirect("/auth/register?error=password");
  }

  const exists = await prisma.user.findUnique({ where: { email } });

  if (exists) {
    redirect("/auth/register?error=exists");
  }

  await prisma.user.create({
    data: {
      email,
      name,
      password: await bcrypt.hash(password, 10),
      role: "CUSTOMER",
    },
  });

  redirect("/auth/login?success=registered");
}

export async function loginWithGoogle(): Promise<void> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    redirect("/auth/login?error=google_not_configured");
  }

  // Important: signIn() for OAuth triggers a redirect by throwing internally.
  // Do not catch here, or you will treat the redirect as an error.
  await signIn("google", { redirectTo: "/" });
}

export async function registerWithGoogle(): Promise<void> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    redirect("/auth/register?error=google_not_configured");
  }

  // Mark this OAuth flow as a "register intent" so existing users get a friendly message.
  const cookieStore = await cookies();
  cookieStore.set("auth_intent", "register", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
  });

  await signIn("google", { redirectTo: "/" });
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

// ========== CART (USER) ACTIONS ==========
type CartItemPayload = Pick<CartItem, "id" | "quantity">;

export async function getCurrentUserId() {
  const session = await auth();
  return { userId: session?.user?.id ?? null };
}

function mapDbCartItemToStoreItem(dbItem: {
  quantity: number;
  expiresAt: Date;
  createdAt: Date;
  product: { id: string; name: string; price: Prisma.Decimal; image: string; stock: number };
}): CartItem {
  return {
    id: dbItem.product.id,
    name: dbItem.product.name,
    price: Number(dbItem.product.price),
    image: dbItem.product.image,
    quantity: dbItem.quantity,
    // Initial maxStock; client polling refines this value.
    maxStock: dbItem.product.stock,
    addedAt: dbItem.createdAt.getTime(),
    expiresAt: dbItem.expiresAt.getTime(),
  };
}

export async function getMyCart() {
  type MyCartResult =
    | { authenticated: false; userId: null; items: CartItem[] }
    | { authenticated: true; userId: string; items: CartItem[] };

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    const result: MyCartResult = { authenticated: false, userId: null, items: [] };
    return result;
  }

  // Fallback: if Cart models are not present in the generated Prisma client,
  // use StockReservation keyed by userId as a server-side cart.
  if (!hasCartTablesInClient()) {
    const now = new Date();

    await prisma.stockReservation.deleteMany({
      where: { sessionId: userId, expiresAt: { lt: now } },
    });

    const reservations = await prisma.stockReservation.findMany({
      where: { sessionId: userId, expiresAt: { gt: now } },
      orderBy: { createdAt: "asc" },
      include: {
        product: { select: { id: true, name: true, price: true, image: true, stock: true } },
      },
    });

    const items = reservations.map((r) => ({
      id: r.product.id,
      name: r.product.name,
      price: Number(r.product.price),
      image: r.product.image,
      quantity: r.quantity,
      maxStock: r.product.stock,
      addedAt: r.createdAt.getTime(),
      expiresAt: r.expiresAt.getTime(),
    }));

    const result: MyCartResult = { authenticated: true, userId, items };
    return result;
  }

  const now = new Date();

  const cart = await prisma.cart.findUnique({ where: { userId }, select: { id: true } });
  if (!cart) {
    const result: MyCartResult = { authenticated: true, userId, items: [] };
    return result;
  }

  // Remove expired entries so cart doesn't resurrect stale items.
  await prisma.cartEntry.deleteMany({ where: { cartId: cart.id, expiresAt: { lt: now } } });

  const cartWithItems = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: { select: { id: true, name: true, price: true, image: true, stock: true } },
        },
      },
    },
  });

  const items = (cartWithItems?.items ?? []).map(mapDbCartItemToStoreItem);
  const result: MyCartResult = { authenticated: true, userId, items };
  return result;
}

async function mutateUserCartItem(params: {
  userId: string;
  productId: string;
  mode: "set" | "add";
  quantity: number;
}) {
  const { userId, productId } = params;
  const requested = Math.max(0, Math.floor(params.quantity));
  const expiresAt = new Date(Date.now() + CART_EXPIRATION_MS);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });

    await tx.cartEntry.deleteMany({ where: { cartId: cart.id, expiresAt: { lt: now } } });
    await tx.stockReservation.deleteMany({ where: { productId, expiresAt: { lt: now } } });

    const [existingReservation, reservations, product, existingEntry] = await Promise.all([
      tx.stockReservation.findFirst({ where: { productId, sessionId: userId } }),
      tx.stockReservation.aggregate({
        where: { productId, expiresAt: { gt: now } },
        _sum: { quantity: true },
      }),
      tx.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, price: true, image: true, stock: true },
      }),
      tx.cartEntry.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
        select: { quantity: true },
      }),
    ]);

    if (!product) throw new Error("Producto no encontrado");

    const currentQty = existingEntry?.quantity ?? 0;
    const desiredQty = params.mode === "add" ? currentQty + requested : requested;

    const totalReserved = reservations._sum.quantity ?? 0;
    const reservedByMe = existingReservation?.quantity ?? 0;
    const totalReservedExcludingMe = Math.max(0, totalReserved - reservedByMe);
    const availableForMe = product.stock - totalReservedExcludingMe;

    if (availableForMe < desiredQty) {
      throw new Error("Stock insuficiente");
    }

    if (desiredQty === 0) {
      await Promise.all([
        tx.cartEntry.deleteMany({ where: { cartId: cart.id, productId } }),
        tx.stockReservation.deleteMany({ where: { productId, sessionId: userId } }),
      ]);
    } else {
      await tx.cartEntry.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        create: { cartId: cart.id, productId, quantity: desiredQty, expiresAt },
        update: { quantity: desiredQty, expiresAt },
      });

      if (existingReservation) {
        await tx.stockReservation.update({
          where: { id: existingReservation.id },
          data: { quantity: desiredQty, expiresAt },
        });
      } else {
        await tx.stockReservation.create({
          data: { productId, quantity: desiredQty, sessionId: userId, expiresAt },
        });
      }
    }

    const cartWithItems = await tx.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            product: { select: { id: true, name: true, price: true, image: true, stock: true } },
          },
        },
      },
    });

    return (cartWithItems?.items ?? []).map(mapDbCartItemToStoreItem);
  });
}

export async function addToMyCart(productId: string, quantityToAdd: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false as const, error: "No autenticado" };

  const qtyToAdd = Math.max(1, Math.floor(quantityToAdd));

  try {
    if (!hasCartTablesInClient()) {
      const now = new Date();
      const existing = await prisma.stockReservation.findFirst({
        where: { productId, sessionId: userId, expiresAt: { gt: now } },
        select: { quantity: true },
      });
      const nextQty = (existing?.quantity ?? 0) + qtyToAdd;
      const reserve = await reserveStock(productId, nextQty, userId);
      if (!reserve.success) {
        return { success: false as const, error: reserve.error || "Stock insuficiente" };
      }
      const fresh = await getMyCart();
      return { success: true as const, items: fresh.items };
    }

    const items = await mutateUserCartItem({
      userId,
      productId,
      mode: "add",
      quantity: qtyToAdd,
    });

    return { success: true as const, items };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false as const, error: message };
  }
}

export async function setMyCartQuantity(productId: string, quantity: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false as const, error: "No autenticado" };

  try {
    if (!hasCartTablesInClient()) {
      const qty = Math.max(0, Math.floor(quantity));
      if (qty === 0) {
        await prisma.stockReservation.deleteMany({ where: { productId, sessionId: userId } });
      } else {
        const reserve = await reserveStock(productId, qty, userId);
        if (!reserve.success) {
          return { success: false as const, error: reserve.error || "Stock insuficiente" };
        }
      }
      const fresh = await getMyCart();
      return { success: true as const, items: fresh.items };
    }

    const items = await mutateUserCartItem({
      userId,
      productId,
      mode: "set",
      quantity,
    });

    return { success: true as const, items };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false as const, error: message };
  }
}

export async function removeFromMyCart(productId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false as const, error: "No autenticado" };

  try {
    if (!hasCartTablesInClient()) {
      await prisma.stockReservation.deleteMany({ where: { productId, sessionId: userId } });
      const fresh = await getMyCart();
      return { success: true as const, items: fresh.items };
    }

    const items = await mutateUserCartItem({
      userId,
      productId,
      mode: "set",
      quantity: 0,
    });

    return { success: true as const, items };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false as const, error: message };
  }
}

export async function clearMyCart() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false as const, error: "No autenticado" };

  try {
    if (!hasCartTablesInClient()) {
      await prisma.stockReservation.deleteMany({ where: { sessionId: userId } });
      return { success: true as const };
    }

    const cart = await prisma.cart.findUnique({ where: { userId }, select: { id: true } });
    if (!cart) return { success: true as const };

    await prisma.$transaction(async (tx) => {
      await tx.cartEntry.deleteMany({ where: { cartId: cart.id } });
      await tx.stockReservation.deleteMany({ where: { sessionId: userId } });
    });

    return { success: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false as const, error: message };
  }
}

export async function validateCartItemsStock(items: CartItemPayload[]) {
  try {
    const unique = new Map<string, number>();
    for (const it of items) {
      unique.set(it.id, (unique.get(it.id) ?? 0) + Math.max(0, Math.floor(it.quantity)));
    }

    const productIds = [...unique.keys()];
    if (productIds.length === 0) return { ok: true as const, issues: [] as { productId: string; message: string }[] };

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true },
    });

    const byId = new Map(products.map((p) => [p.id, p]));
    const issues: { productId: string; message: string }[] = [];

    for (const [productId, qty] of unique.entries()) {
      const p = byId.get(productId);
      if (!p) {
        issues.push({ productId, message: "Producto no encontrado" });
        continue;
      }
      if (p.stock < qty) {
        issues.push({ productId, message: `Stock insuficiente para ${p.name}` });
      }
    }

    return { ok: issues.length === 0, issues };
  } catch {
    return { ok: false as const, issues: [{ productId: "unknown", message: "Error al validar stock" }] };
  }
}

// ========== STOCK RESERVATION ACTIONS ==========
export async function reserveStock(
  productId: string,
  quantity: number,
  sessionId: string
) {
  try {
    const expiresAt = new Date(Date.now() + CART_EXPIRATION_MS);

    await prisma.$transaction(async (tx) => {
      await tx.stockReservation.deleteMany({
        where: { productId, expiresAt: { lt: new Date() } },
      });

      const existing = await tx.stockReservation.findFirst({
        where: { productId, sessionId },
      });

      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });

      if (!product) throw new Error("Producto no encontrado");

      const reservations = await tx.stockReservation.aggregate({
        where: { productId, expiresAt: { gt: new Date() } },
        _sum: { quantity: true },
      });

      const totalReserved = reservations._sum.quantity ?? 0;
      const reservedByMe = existing?.quantity ?? 0;
      const totalReservedExcludingMe = Math.max(0, totalReserved - reservedByMe);
      const availableForMe = product.stock - totalReservedExcludingMe;

      if (availableForMe < quantity) {
        throw new Error("Stock insuficiente");
      }

      if (existing) {
        await tx.stockReservation.update({
          where: { id: existing.id },
          data: { quantity, expiresAt },
        });
      } else {
        await tx.stockReservation.create({
          data: { productId, quantity, sessionId, expiresAt },
        });
      }
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

export async function releaseReservation(
  productId: string,
  sessionId: string
) {
  try {
    await prisma.stockReservation.deleteMany({
      where: { productId, sessionId },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getAvailableStockFromDB(productId: string) {
  try {
    await prisma.stockReservation.deleteMany({
      where: { productId, expiresAt: { lt: new Date() } },
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });

    if (!product) return { stock: 0 };

    const reservations = await prisma.stockReservation.aggregate({
      where: { productId, expiresAt: { gt: new Date() } },
      _sum: { quantity: true },
    });

    const totalReserved = reservations._sum.quantity ?? 0;
    return { stock: product.stock - totalReserved };
  } catch {
    return { stock: 0 };
  }
}

export async function updateOrderDeliveryStatus(formData: FormData) {
  const orderId = formData.get("orderId");
  const requestedStatus = formData.get("deliveryStatus");

  if (typeof orderId !== "string" || typeof requestedStatus !== "string") {
    throw new Error("Solicitud inválida");
  }

  await requireAdminUser();

  if (!["PACKAGING", "SHIPPED"].includes(requestedStatus)) {
    throw new Error("Estado de entrega inválido");
  }

  const currentOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      packagedAt: true,
      shippedAt: true,
    },
  });

  if (!currentOrder) {
    throw new Error("Pedido no encontrado");
  }

  const nextStatus = requestedStatus as DeliveryStatus;
  const now = new Date();
  const data: {
    deliveryStatus: DeliveryStatus;
    packagedAt?: Date;
    shippedAt?: Date;
  } = {
    deliveryStatus: nextStatus,
  };

  if (nextStatus === "PACKAGING") {
    data.packagedAt = currentOrder.packagedAt ?? now;
  }

  if (nextStatus === "SHIPPED") {
    data.packagedAt = currentOrder.packagedAt ?? now;
    data.shippedAt = currentOrder.shippedAt ?? now;
  }

  await prisma.order.update({
    where: { id: orderId },
    data,
  });

  const orderForEmail = await getOrderEmailPayload(orderId);
  if (orderForEmail) {
    try {
      await sendDeliveryStatusEmail(orderForEmail);
    } catch (emailError) {
      console.error("Delivery status email failed:", emailError);
    }
  }

  revalidateOrderPaths(orderId);
}

export async function confirmOrderReceived(formData: FormData) {
  const orderId = formData.get("orderId");

  if (typeof orderId !== "string") {
    throw new Error("Solicitud inválida");
  }

  const session = await requireAuthenticatedUser();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      userId: true,
      deliveryStatus: true,
      receivedAt: true,
    },
  });

  if (!order) {
    throw new Error("Pedido no encontrado");
  }

  if (order.userId !== session.user.id) {
    throw new Error("No autorizado");
  }

  if (order.deliveryStatus !== "SHIPPED") {
    throw new Error("El pedido aún no está listo para confirmación");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryStatus: "RECEIVED",
      receivedAt: order.receivedAt ?? new Date(),
    },
  });

  const orderForEmail = await getOrderEmailPayload(orderId);
  if (orderForEmail) {
    try {
      await sendDeliveryStatusEmail(orderForEmail);
    } catch (emailError) {
      console.error("Received confirmation email failed:", emailError);
    }
  }

  revalidateOrderPaths(orderId);
}
