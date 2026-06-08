import React, { useState } from "react";
import ModalOverlay from "../components/ModalOverlay";
import InfoBanner from "../components/InfoBanner";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { transportistasService } from "../lib/sistratec";
import { mensajeDeError } from "../lib/api";

interface AgregarTransportistaModalProps {
  onCreado: () => void;
  onCancel: () => void;
}

const InfoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d4f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const AgregarTransportistaModal: React.FC<AgregarTransportistaModalProps> = ({ onCreado, onCancel }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const camposCompletos =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    address.trim().length > 0 &&
    password.length > 0;

  const validarFormulario = (): string | null => {
    if (fullName.trim().length < 2) return "El nombre completo debe tener al menos 2 caracteres.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Ingresa un correo electrónico válido.";
    if (!/^\d{8}$/.test(phone)) return "El teléfono debe tener exactamente 8 dígitos.";
    if (address.trim().length < 5) return "La dirección exacta debe tener al menos 5 caracteres.";
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      return "La contraseña debe tener mínimo 8 caracteres, incluir una letra mayúscula y al menos un número.";
    }
    return null;
  };

  const crear = async () => {
    setError(null);
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setEnviando(true);
    try {
      await transportistasService.crear({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        password,
        vehicle: vehicle.trim() || undefined,
      });
      onCreado();
    } catch (err) {
      setError(mensajeDeError(err));
      setEnviando(false);
    }
  };

  return (
    <ModalOverlay onClose={onCancel}>
      <div style={styles.header}>
        <h2 style={styles.title}>Agregar transportista</h2>
        <button style={styles.closeBtn} onClick={onCancel} aria-label="Cerrar">
          ×
        </button>
      </div>

      <InfoBanner
        variant="info"
        icon={<InfoIcon />}
        title="¿Por qué creamos esta cuenta?"
        description="El transportista usará estas credenciales para iniciar sesión y ver únicamente las donaciones que le asignes. La contraseña es temporal: podrá cambiarla desde su perfil."
      />

      <div style={styles.form}>
        <InputField
          label="Nombre completo"
          placeholder="Ej: Jorge Quesada Mora"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          helperText="Como aparece en la cédula del transportista."
        />
        <InputField
          label="Correo electrónico"
          type="email"
          placeholder="jorge.quesada@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          helperText="Será su usuario para iniciar sesión."
        />
        <InputField
          label="Teléfono"
          type="tel"
          placeholder="88881234"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
          helperText="8 dígitos sin espacios ni guiones."
        />
        <InputField
          label="Dirección exacta"
          placeholder="Provincia, cantón, distrito y señas"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          helperText="Nos ayuda a coordinar las rutas de recolección."
        />
        <InputField
          label="Vehículo (opcional)"
          placeholder="Ej: Camión de carga, placa CL-1234"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
          helperText="Se usará como referencia al asignarle donaciones."
        />
        <InputField
          label="Contraseña temporal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showToggle
          helperText="Mínimo 8 caracteres, con al menos una mayúscula y un número."
        />
      </div>

      {error && (
        <InfoBanner variant="warning" icon={<ErrorIcon />} title="No pudimos crear la cuenta" description={error} />
      )}

      <div style={styles.actions}>
        <button style={styles.cancelBtn} onClick={onCancel} disabled={enviando}>
          Cancelar
        </button>
        <div style={styles.confirmWrap}>
          <PrimaryButton
            label={enviando ? "Creando cuenta..." : "Crear cuenta"}
            onClick={crear}
            disabled={!camposCompletos || enviando}
          />
        </div>
      </div>
    </ModalOverlay>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "700",
    fontFamily: "'Inter', sans-serif",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#8a9bb0",
    fontSize: "22px",
    cursor: "pointer",
    lineHeight: 1,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  actions: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
  },
  cancelBtn: {
    flex: "0 0 auto",
    padding: "14px 24px",
    backgroundColor: "transparent",
    color: "#cdd6e0",
    border: "1px solid #2e3f50",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: "600",
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
  },
  confirmWrap: {
    flex: 1,
  },
};

export default AgregarTransportistaModal;
