import type { OrderStatus } from "@prisma/client";

type DeliveryStatus = "PENDING" | "PACKAGING" | "SHIPPED" | "RECEIVED";

export function getPaymentStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PAID":
      return "Pagado";
    case "FAILED":
      return "Fallido";
    default:
      return "Pendiente";
  }
}

export function getDeliveryStatusLabel(status: DeliveryStatus) {
  switch (status) {
    case "PACKAGING":
      return "En empaquetado";
    case "SHIPPED":
      return "Enviado";
    case "RECEIVED":
      return "Recibido";
    default:
      return "Pendiente";
  }
}

export function getDeliveryStatusDescription(status: DeliveryStatus) {
  switch (status) {
    case "PACKAGING":
      return "Estamos preparando el pedido para su salida.";
    case "SHIPPED":
      return "El pedido fue despachado manualmente y va en camino.";
    case "RECEIVED":
      return "El cliente confirmó la entrega.";
    default:
      return "La compra fue recibida y está pendiente de preparación.";
  }
}
