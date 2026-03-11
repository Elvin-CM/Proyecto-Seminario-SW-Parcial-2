"use client";

import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

function loginErrorMessage(code: string) {
  if (code === "missing") return "Completa tu email y contrasena";
  if (code === "google_not_configured") return "Google no esta configurado";
  if (code.toLowerCase().includes("oauth")) return "No se pudo iniciar sesion con Google";
  if (code === "CallbackRouteError") return "No se pudo iniciar sesion con Google";
  if (code === "Configuration") return "Google no esta configurado";
  if (code === "AccessDenied") return "Acceso denegado";
  if (code === "AccountNotLinked") return "Cuenta no vinculada";
  return "Credenciales invalidas";
}

function registerErrorMessage(code: string) {
  if (code === "exists") return "El email ya esta registrado";
  if (code === "missing") return "Completa todos los campos";
  if (code === "email") return "Ingresa un email valido";
  if (code === "password") return "Contrasena muy corta";
  if (code === "google_not_configured") return "Google no esta configurado";
  if (code.toLowerCase().includes("oauth")) return "No se pudo registrar con Google";
  if (code === "AccessDenied") return "Acceso denegado";
  return "No se pudo crear la cuenta";
}

export function LoginToasts(props: { error?: string; success?: string }) {
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${props.error ?? ""}|${props.success ?? ""}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    if (props.error) toast.error(loginErrorMessage(props.error), { duration: 5000 });
    if (props.success === "registered") toast.success("Cuenta creada", { duration: 5000 });
  }, [props.error, props.success]);

  return null;
}

export function RegisterToasts(props: { error?: string }) {
  const lastError = useRef<string | null>(null);

  useEffect(() => {
    if (!props.error) {
      lastError.current = null;
      return;
    }

    if (lastError.current === props.error) return;
    lastError.current = props.error;

    // Slight delay to ensure toast shows after hydration/navigation.
    const t = setTimeout(() => {
      toast.error(registerErrorMessage(props.error!), { duration: 5000 });
    }, 50);

    return () => clearTimeout(t);
  }, [props.error]);

  return null;
}
