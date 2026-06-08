import React, { useEffect, useState } from "react";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { perfilService, validarNuevaPassword, type Usuario } from "../lib/sistratec";
import { api, mensajeDeError } from "../lib/api";

interface PanelPerfilProps {
  mostrarVehiculo?: boolean;
  mostrarCentro?: boolean;
}

interface CentroAcopio {
  id: number;
  nombre: string;
  direccion?: string;
}

const ROL_LABEL: Record<string, string> = {
  admin: "Administrador",
  transporter: "Transportista",
  donor: "Donante",
};

const PanelPerfil: React.FC<PanelPerfilProps> = ({ mostrarVehiculo = false, mostrarCentro = false }) => {
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [collectionCenterId, setCollectionCenterId] = useState<number | "">("");
  const [centros, setCentros] = useState<CentroAcopio[]>([]);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordRepetir, setPasswordRepetir] = useState("");
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [mensajePass, setMensajePass] = useState<string | null>(null);
  const [errorPass, setErrorPass] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    perfilService
      .obtener()
      .then((datos) => {
        if (!activo) return;
        setPerfil(datos);
        setFullName(datos.fullName);
        setEmail(datos.email);
        setPhone(datos.phone || "");
        setAddress(datos.address || "");
        setVehicle(datos.vehicle || "");
        setCollectionCenterId(datos.collectionCenterId ?? "");
      })
      .catch((err) => {
        if (!activo) return;
        setError(mensajeDeError(err));
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!mostrarCentro) return;
    api.get<CentroAcopio[]>("/catalog/collection-centers")
      .then(setCentros)
      .catch(() => undefined);
  }, [mostrarCentro]);

  const guardarPerfil = async () => {
    setMensaje(null);
    setError(null);
    setGuardando(true);
    try {
      const datos: Partial<Pick<Usuario, "fullName" | "email" | "phone" | "vehicle">> & { collectionCenterId?: number | null } = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      };
      if (mostrarVehiculo) datos.vehicle = vehicle.trim() || undefined;
      if (mostrarCentro) datos.collectionCenterId = collectionCenterId === "" ? null : Number(collectionCenterId);
      const actualizado = await perfilService.actualizar(datos);
      setPerfil(actualizado);
      setMensaje("Tus datos se actualizaron correctamente.");
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarPassword = async () => {
    setMensajePass(null);
    setErrorPass(null);

    const errorValidacion = validarNuevaPassword(passwordActual, passwordNueva, passwordRepetir);
    if (errorValidacion) {
      setErrorPass(errorValidacion);
      return;
    }

    setCambiandoPass(true);
    try {
      await perfilService.cambiarPassword(passwordActual, passwordNueva, passwordRepetir);
      setMensajePass("Tu contraseña se actualizó correctamente.");
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordRepetir("");
    } catch (err) {
      setErrorPass(mensajeDeError(err));
    } finally {
      setCambiandoPass(false);
    }
  };

  const passwordValida = passwordActual.length > 0 && passwordNueva.length > 0 && passwordRepetir.length > 0;

  const iniciales = (fullName || "U")
    .split(" ")
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

  const rolEtiqueta = perfil?.role ? (ROL_LABEL[perfil.role] || perfil.role) : "Usuario";

  return (
    <div style={styles.grid}>
      <div style={styles.left}>
        <div style={styles.profileCard}>
          <div style={styles.avatarBig}>{iniciales}</div>
          <h3 style={styles.profileName}>{fullName || ""}</h3>
          <span style={styles.profileEmail}>{email || ""}</span>
          <span style={styles.profileTag}>{rolEtiqueta} registrado</span>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Datos personales</h2>
          <span style={styles.panelDesc}>Actualiza tus datos de contacto.</span>

          <div style={styles.form}>
            <InputField
              label="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              helperText="Tu nombre tal y como aparece en tu cédula."
            />
            <InputField
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              helperText="Se usa para iniciar sesión y recibir notificaciones."
            />
            <InputField
              label="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              helperText="8 dígitos sin espacios ni guiones."
            />
            <InputField
              label="Dirección"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              helperText="Dirección donde podemos ubicarte."
            />
            {mostrarVehiculo && (
              <InputField
                label="Vehículo"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                helperText="Tipo de vehículo y placa que usás para trasladar donaciones."
              />
            )}
            {mostrarCentro && (
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Centro de acopio</label>
                <select
                  value={collectionCenterId}
                  onChange={(e) => setCollectionCenterId(e.target.value ? Number(e.target.value) : "")}
                  style={styles.select}
                >
                  <option value="">Sin asignar</option>
                  {centros.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <span style={styles.helper}>Centro de acopio al que estás asociado.</span>
              </div>
            )}
          </div>

          {mensaje && <div style={styles.successBox}>{mensaje}</div>}
          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={{ marginTop: 8 }}>
            <PrimaryButton label={guardando ? "Guardando..." : "Guardar cambios"} onClick={guardarPerfil} disabled={guardando} />
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Cambiar contraseña</h2>
          <span style={styles.panelDesc}>Por seguridad, te pediremos tu contraseña actual.</span>

          <div style={styles.form}>
            <InputField
              label="Contraseña actual"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              showToggle
              helperText="Ingresa la contraseña que usás actualmente para confirmar tu identidad."
            />
            <InputField
              label="Nueva contraseña"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              showToggle
              helperText="Mínimo 8 caracteres, una letra mayúscula y un número."
            />
            <InputField
              label="Confirmar nueva contraseña"
              value={passwordRepetir}
              onChange={(e) => setPasswordRepetir(e.target.value)}
              showToggle
              helperText="Repite la nueva contraseña para evitar errores tipográficos."
            />
          </div>

          {mensajePass && <div style={styles.successBox}>{mensajePass}</div>}
          {errorPass && <div style={styles.errorBox}>{errorPass}</div>}

          <div style={{ marginTop: 8 }}>
            <PrimaryButton
              label={cambiandoPass ? "Actualizando..." : "Guardar nueva contraseña"}
              onClick={cambiarPassword}
              disabled={!passwordValida || cambiandoPass}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "flex",
    justifyContent: "center",
  },
  left: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
    maxWidth: 720,
  },
  profileCard: {
    backgroundColor: "#1A1D23",
    border: "1px solid #232830",
    borderRadius: "14px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  avatarBig: {
    width: 84,
    height: 84,
    borderRadius: "50%",
    backgroundColor: "#00d4f5",
    color: "#0a0f14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
  },
  profileName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    margin: 0,
  },
  profileEmail: {
    color: "#cdd6e0",
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
  },
  profileTag: {
    color: "#8a9bb0",
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
  },
  panel: {
    backgroundColor: "#1A1D23",
    border: "1px solid #232830",
    borderRadius: "14px",
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    margin: 0,
  },
  panelDesc: {
    color: "#8a9bb0",
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
    marginTop: -8,
  },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  fieldLabel: {
    color: "#cdd6e0",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
  },
  select: {
    backgroundColor: "#13161C",
    border: "1px solid #2e3f50",
    borderRadius: "8px",
    padding: "12px 14px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    color: "#EFEFEF",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  helper: {
    color: "#7a8696",
    fontSize: "11px",
    fontFamily: "'Inter', sans-serif",
  },
  successBox: {
    backgroundColor: "rgba(22,163,74,0.12)",
    border: "1px solid #16a34a",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#3fd17e",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
  },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.10)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#F87171",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
  },
};

export default PanelPerfil;
