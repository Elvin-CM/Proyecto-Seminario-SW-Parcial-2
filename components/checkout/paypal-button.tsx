"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useCartStore } from "@/lib/store";
import { clearMyCart, createOrder, releaseReservation, validateCartItemsStock } from "@/lib/actions";
import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export function PayPalCheckout() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isProcessing, setIsProcessing] = useState(false);

  const getSessionId = () => {
    let sessionId = localStorage.getItem("cart-session-id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("cart-session-id", sessionId);
    }
    return sessionId;
  };

  const totalAmount = items.reduce(
    (acc, item) => acc + item.price * item.quantity, 
    0
  );
  const finalAmount = (totalAmount * 1.15).toFixed(2);

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R", // Fallback test client ID
    currency: "USD",
    intent: "capture",
  };

  // Check if PayPal client ID is configured
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-red-800">Error de PayPal</p>
          <p className="text-red-700 mt-1">PayPal Client ID no configurado</p>
          <p className="text-red-600 mt-2 text-xs">
            Verifica que el CLIENT_ID de PayPal esté configurado correctamente en las variables de entorno.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PayPalScriptProvider
        options={initialOptions}
        deferLoading={false}
      >
        <div className="relative z-0">
          
          {/* 
             FIX: The Spinner is now an OVERLAY. 
             The PayPal buttons remain in the DOM underneath, preventing the crash.
          */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center border rounded-lg backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm font-medium text-primary">Procesando...</p>
            </div>
          )}

          <PayPalButtons
          className={isProcessing ? "opacity-50 pointer-events-none" : ""}
          style={{ layout: "vertical", shape: "rect" }}
          createOrder={(data, actions) => {
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    currency_code: "USD",
                    value: finalAmount,
                  },
                  description: "Compra en PrototypeStore",
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            try {
              setIsProcessing(true); // Show overlay

              // Validate stock right before capture to avoid charging without stock.
              const validation = await validateCartItemsStock(
                items.map((i) => ({ id: i.id, quantity: i.quantity }))
              );
              if (!validation.ok) {
                setIsProcessing(false);
                toast.error("Stock insuficiente");
                return;
              }
              
              // 1. Capture Payment
              const details = await actions.order?.capture();
              if (!details) throw new Error("No details received");

              // 2. Create Order in DB
              const email = details.payer?.email_address || "guest@example.com";
              const result = await createOrder(items, data.orderID, email);

              console.log("Server Result:", result); // Debugging log

              if (result.success && result.orderId) {
                // 3. SUCCESS!
                const cleared = await clearMyCart();
                if (!cleared.success && cleared.error === "No autenticado") {
                  const sessionId = getSessionId();
                  await Promise.all(items.map((i) => releaseReservation(i.id, sessionId)));
                }
                clearCart(); 
                
                window.location.href = `/track/${result.orderId}?success=true`;
                
              } else {
                throw new Error(result.error || "Error al guardar la orden");
              }

            } catch (error) {
              console.error("Checkout Error:", error);
              setIsProcessing(false);
            const message = error instanceof Error ? error.message : "Error desconocido al procesar el pago";
            toast.error(message);
            }
          }}
          onError={(err) => {
            console.error("PayPal SDK Error:", err);
            toast.error("Error de conexion con PayPal");
          }}
        />
        </div>
      </PayPalScriptProvider>
    </div>
  );
}
