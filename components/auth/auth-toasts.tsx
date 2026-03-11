"use client";

import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

function loginErrorMessage(code: string) {
  if (code === "missing") return "Completa tu email y contrasena";
  if (code === "google_not_configured") return "Google no esta configurado";
  if (code === "google") return "No se pudo iniciar sesion con Google";
  return "Credenciales invalidas";
}

function registerErrorMessage(code: string) {
  if (code === "exists") return "El email ya esta registrado";
  if (code === "missing") return "Completa todos los campos";
  if (code === "email") return "Ingresa un email valido";
  if (code === "password") return "Contrasena muy corta";
  return "No se pudo crear la cuenta";
}

export function LoginToasts(props: { error?: string; success?: string }) {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;

    if (props.error) toast.error(loginErrorMessage(props.error));
    if (props.success === "registered") toast.success("Cuenta creada");
  }, [props.error, props.success]);

  return null;
}

export function RegisterToasts(props: { error?: string }) {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;

    if (props.error) toast.error(registerErrorMessage(props.error));
  }, [props.error]);

  return null;
}
