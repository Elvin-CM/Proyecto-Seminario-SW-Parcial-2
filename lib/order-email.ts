import type { DeliveryStatus, Prisma } from "@prisma/client";

type OrderForEmail = {
  id: string;
  customerEmail: string;
  totalAmount: Prisma.Decimal;
  createdAt: Date;
  deliveryStatus: DeliveryStatus;
  user: { name: string | null } | null;
  items: Array<{
    quantity: number;
    price: Prisma.Decimal;
    product: { name: string };
  }>;
};

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "http://localhost:3000";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTrackingUrl(orderId: string) {
  return `${APP_URL.replace(/\/$/, "")}/track/${orderId}`;
}

function buildItemsHtml(order: OrderForEmail) {
  return order.items
    .map((item) => {
      const unitPrice = Number(item.price).toFixed(2);
      return `<li>${escapeHtml(item.product.name)} x${item.quantity} - $${unitPrice}</li>`;
    })
    .join("");
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL || "Prototype Store <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("Correo omitido: falta RESEND_API_KEY");
    return { sent: false, skipped: true as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`No se pudo enviar el correo: ${response.status} ${errorBody}`);
  }

  return { sent: true as const, skipped: false as const };
}

export async function sendOrderConfirmationEmail(order: OrderForEmail) {
  const customerName = order.user?.name?.trim() || "cliente";
  const total = Number(order.totalAmount).toFixed(2);
  const trackingUrl = buildTrackingUrl(order.id);

  return sendEmail({
    to: order.customerEmail,
    subject: `Recibimos tu pedido ${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Gracias por tu compra, ${escapeHtml(customerName)}</h2>
        <p>Tu pedido <strong>${escapeHtml(order.id)}</strong> fue registrado correctamente.</p>
        <p>Total pagado: <strong>$${total}</strong></p>
        <p>Estado de entrega actual: <strong>Pendiente de preparación</strong></p>
        <p>Productos:</p>
        <ul>${buildItemsHtml(order)}</ul>
        <p>Puedes seguir tu pedido aquí:</p>
        <p><a href="${trackingUrl}">${trackingUrl}</a></p>
      </div>
    `,
    text: [
      `Gracias por tu compra, ${customerName}.`,
      `Tu pedido ${order.id} fue registrado correctamente.`,
      `Total pagado: $${total}.`,
      "Estado de entrega actual: Pendiente de preparación.",
      `Seguimiento: ${trackingUrl}`,
    ].join("\n"),
  });
}

export async function sendDeliveryStatusEmail(order: OrderForEmail) {
  const trackingUrl = buildTrackingUrl(order.id);

  const statusCopy: Record<DeliveryStatus, { subject: string; label: string; message: string }> = {
    PENDING: {
      subject: `Tu pedido ${order.id} está pendiente de preparación`,
      label: "Pendiente de preparación",
      message: "Recibimos tu compra y pronto comenzaremos a preparar tu paquete.",
    },
    PACKAGING: {
      subject: `Tu pedido ${order.id} está en empaquetado`,
      label: "En empaquetado",
      message: "Tu pedido ya está siendo preparado para el envío.",
    },
    SHIPPED: {
      subject: `Tu pedido ${order.id} fue enviado`,
      label: "Enviado",
      message: "Tu pedido salió de bodega. Cuando lo recibas, puedes confirmarlo desde el seguimiento.",
    },
    RECEIVED: {
      subject: `Confirmamos la recepción de tu pedido ${order.id}`,
      label: "Recibido",
      message: "Gracias por confirmar que el pedido llegó correctamente.",
    },
  };

  const copy = statusCopy[order.deliveryStatus];

  return sendEmail({
    to: order.customerEmail,
    subject: copy.subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Actualización de tu pedido ${escapeHtml(order.id)}</h2>
        <p><strong>Estado actual:</strong> ${escapeHtml(copy.label)}</p>
        <p>${escapeHtml(copy.message)}</p>
        <p>Consulta el detalle aquí:</p>
        <p><a href="${trackingUrl}">${trackingUrl}</a></p>
      </div>
    `,
    text: [
      `Actualización de tu pedido ${order.id}.`,
      `Estado actual: ${copy.label}.`,
      copy.message,
      `Seguimiento: ${trackingUrl}`,
    ].join("\n"),
  });
}
