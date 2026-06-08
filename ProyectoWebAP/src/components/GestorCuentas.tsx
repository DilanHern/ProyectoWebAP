import React, { useCallback, useEffect, useState } from "react";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import ModalOverlay from "../components/ModalOverlay";
import InfoBanner from "../components/InfoBanner";
import { type Usuario } from "../lib/sistratec";
import { mensajeDeError } from "../lib/api";

interface ServicioCuentas {
  listar: () => Promise<Usuario[]>;
  editar: (id: string, datos: Partial<Pick<Usuario, "fullName" | "email" | "phone">>) => Promise<Usuario>;
  cambiarEstado: (id: string, activo: boolean) => Promise<Usuario>;
}

interface GestorCuentasProps {
  titulo: string;
  descripcion: string;
  servicio: ServicioCuentas;
  etiquetaAgregar: string;
  onAgregar: () => void;
  refrescarSenal: number;
  mostrarVehiculo?: boolean;
}

const GestorCuentas: React.FC<GestorCuentasProps> = ({
  titulo,
  descripcion,
  servicio,
  etiquetaAgregar,
  onAgregar,
  refrescarSenal,
  mostrarVehiculo = false,
}) => {
  const [cuentas, setCuentas] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [cuentaACambiarEstado, setCuentaACambiarEstado] = useState<Usuario | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setCuentas(await servicio.listar());
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, [servicio]);

  useEffect(() => {
    cargar();
  }, [cargar, refrescarSenal]);

  const cambiarEstado = async (cuenta: Usuario, desdeConfirmacion = false) => {
    setError(null);
    setErrorEstado(null);
    setCambiandoEstado(true);
    try {
      await servicio.cambiarEstado(cuenta.id, !cuenta.isActive);
      if (desdeConfirmacion) setCuentaACambiarEstado(null);
      await cargar();
    } catch (err) {
      const mensaje = mensajeDeError(err);
      if (desdeConfirmacion) setErrorEstado(mensaje);
      else setError(mensaje);
    } finally {
      setCambiandoEstado(false);
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <div>
          <h2 style={styles.panelTitle}>{titulo}</h2>
          <span style={styles.panelDesc}>{descripcion}</span>
        </div>
        <button style={styles.agregarBtn} onClick={onAgregar}>
          + {etiquetaAgregar}
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {cargando ? (
        <p style={styles.vacio}>Cargando...</p>
      ) : cuentas.length === 0 ? (
        <p style={styles.vacio}>Aún no hay cuentas registradas en tu centro de acopio.</p>
      ) : (
        <div style={styles.tablaWrap}>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Correo</th>
                {mostrarVehiculo && <th style={styles.th}>Vehículo</th>}
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((c) => (
                <tr key={c.id} style={styles.tr}>
                  <td style={styles.td}>{c.fullName}</td>
                  <td style={styles.td}>{c.email}</td>
                  {mostrarVehiculo && <td style={styles.td}>{c.vehicle || "Sin asignar"}</td>}
                  <td style={styles.td}>
                    <span style={{ ...styles.estado, ...(c.isActive ? styles.estadoActivo : styles.estadoInactivo) }}>
                      {c.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.acciones}>
                      <button style={styles.linkBtn} onClick={() => setEditando(c)}>
                        Editar
                      </button>
                      <button
                        style={c.isActive ? styles.linkBtnRojo : styles.linkBtnVerde}
                        onClick={() => {
                          setErrorEstado(null);
                          setCuentaACambiarEstado(c);
                        }}
                      >
                        {c.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <EditarCuentaModal
          cuenta={editando}
          mostrarVehiculo={mostrarVehiculo}
          servicio={servicio}
          onGuardado={() => {
            setEditando(null);
            cargar();
          }}
          onCancel={() => setEditando(null)}
        />
      )}

      {cuentaACambiarEstado && (
        <ConfirmarCambiarEstadoCuentaModal
          cuenta={cuentaACambiarEstado}
          enviando={cambiandoEstado}
          error={errorEstado}
          onConfirm={() => cambiarEstado(cuentaACambiarEstado, true)}
          onCancel={() => {
            if (cambiandoEstado) return;
            setCuentaACambiarEstado(null);
            setErrorEstado(null);
          }}
        />
      )}
    </div>
  );
};

interface ConfirmarCambiarEstadoCuentaModalProps {
  cuenta: Usuario;
  enviando: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const WarningIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d4f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ConfirmarCambiarEstadoCuentaModal: React.FC<ConfirmarCambiarEstadoCuentaModalProps> = ({
  cuenta,
  enviando,
  error,
  onConfirm,
  onCancel,
}) => {
  const vaADesactivar = cuenta.isActive;
  const accion = vaADesactivar ? "desactivar" : "activar";
  const accionCapitalizada = vaADesactivar ? "Desactivar" : "Activar";
  const etiquetaEnviando = vaADesactivar ? "Desactivando..." : "Activando...";

  return (
    <ModalOverlay onClose={onCancel}>
      <div style={styles.modalHeader}>
        <h2 style={styles.modalTitle}>{accionCapitalizada} cuenta</h2>
        <button style={styles.closeBtn} onClick={onCancel} aria-label="Cerrar" disabled={enviando}>
          ×
        </button>
      </div>

      <InfoBanner
        variant="info"
        icon={<UserIcon />}
        title={`Vas a ${accion} a ${cuenta.fullName}`}
        description={cuenta.email}
      />

      <InfoBanner
        variant="warning"
        icon={<WarningIcon />}
        title={vaADesactivar ? "Esta cuenta perderá acceso" : "Esta cuenta recuperará acceso"}
        description={
          vaADesactivar
            ? "La persona no podrá iniciar sesión ni usar las funciones de su rol mientras la cuenta esté inactiva. Podrás activarla nuevamente desde este panel."
            : "La persona podrá volver a iniciar sesión y usar las funciones de su rol. Podrás desactivarla nuevamente desde este panel."
        }
      />

      {error && (
        <InfoBanner
          variant="warning"
          icon={<WarningIcon />}
          title={`No pudimos ${accion} la cuenta`}
          description={error}
        />
      )}

      <div style={styles.modalActions}>
        <button style={styles.cancelBtn} onClick={onCancel} disabled={enviando}>
          Cancelar
        </button>
        <button
          style={vaADesactivar ? styles.dangerConfirmBtn : styles.successConfirmBtn}
          onClick={onConfirm}
          disabled={enviando}
        >
          {enviando ? etiquetaEnviando : `${accionCapitalizada} cuenta`}
        </button>
      </div>
    </ModalOverlay>
  );
};

interface EditarCuentaModalProps {
  cuenta: Usuario;
  mostrarVehiculo: boolean;
  servicio: ServicioCuentas;
  onGuardado: () => void;
  onCancel: () => void;
}

const EditarCuentaModal: React.FC<EditarCuentaModalProps> = ({
  cuenta,
  mostrarVehiculo,
  servicio,
  onGuardado,
  onCancel,
}) => {
  const [fullName, setFullName] = useState(cuenta.fullName);
  const [email, setEmail] = useState(cuenta.email);
  const [phone, setPhone] = useState(cuenta.phone || "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    setError(null);
    setEnviando(true);
    try {
      const datos: Partial<Pick<Usuario, "fullName" | "email" | "phone" | "vehicle">> = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      };
      await servicio.editar(cuenta.id, datos);
      onGuardado();
    } catch (err) {
      setError(mensajeDeError(err));
      setEnviando(false);
    }
  };

  return (
    <ModalOverlay onClose={onCancel}>
      <div style={styles.modalHeader}>
        <h2 style={styles.modalTitle}>Editar cuenta</h2>
        <button style={styles.closeBtn} onClick={onCancel} aria-label="Cerrar">
          ×
        </button>
      </div>
      <div style={styles.form}>
        <InputField
          label="Nombre completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          helperText={mostrarVehiculo ? "Como aparece en la cédula del transportista." : "Como aparece en la cédula."}
        />
        <InputField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          helperText="Será su usuario para iniciar sesión."
        />
        <InputField
          label="Teléfono (opcional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          helperText="8 dígitos. Lo usamos para coordinar entregas."
        />
        {mostrarVehiculo && cuenta.vehicle !== undefined && (
          <p style={styles.nota}>El vehículo se actualiza desde el perfil del transportista.</p>
        )}
      </div>
      {error && <div style={styles.errorBox}>{error}</div>}
      <div style={styles.modalActions}>
        <button style={styles.cancelBtn} onClick={onCancel} disabled={enviando}>
          Cancelar
        </button>
        <div style={{ flex: 1 }}>
          <PrimaryButton label={enviando ? "Guardando..." : "Guardar cambios"} onClick={guardar} disabled={enviando} />
        </div>
      </div>
    </ModalOverlay>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: "#1A1D23",
    border: "1px solid #232830",
    borderRadius: "14px",
    padding: "22px 24px",
  },
  panelHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "18px",
    gap: "14px",
    flexWrap: "wrap",
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: "700",
    fontFamily: "'Inter', sans-serif",
    margin: 0,
  },
  panelDesc: {
    color: "#8a9bb0",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
  },
  agregarBtn: {
    padding: "10px 16px",
    backgroundColor: "#00d4f5",
    color: "#0a0f14",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  errorBox: {
    backgroundColor: "rgba(184,134,11,0.10)",
    border: "1px solid #b8860b",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#f0d488",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
    marginBottom: "14px",
  },
  tablaWrap: { overflowX: "auto" },
  tabla: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "'Inter', sans-serif",
  },
  th: {
    textAlign: "left",
    color: "#8a9bb0",
    fontSize: "12px",
    fontWeight: "600",
    padding: "10px 12px",
    borderBottom: "1px solid #232830",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid #1A1D23" },
  td: {
    color: "#cdd6e0",
    fontSize: "13px",
    padding: "14px 12px",
    verticalAlign: "middle",
  },
  estado: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  },
  estadoActivo: { backgroundColor: "rgba(22,163,74,0.15)", color: "#3fd17e" },
  estadoInactivo: { backgroundColor: "#2e3f50", color: "#8a9bb0" },
  acciones: { display: "flex", gap: "14px" },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#00d4f5",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
    padding: 0,
  },
  linkBtnRojo: {
    background: "none",
    border: "none",
    color: "#e06464",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
    padding: 0,
  },
  linkBtnVerde: {
    background: "none",
    border: "none",
    color: "#3fd17e",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
    padding: 0,
  },
  vacio: {
    color: "#8a9bb0",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    textAlign: "center",
    padding: "30px 0",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
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
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  nota: {
    color: "#8a9bb0",
    fontSize: "12px",
    fontFamily: "'Inter', sans-serif",
    margin: 0,
  },
  modalActions: { display: "flex", gap: "14px", alignItems: "center" },
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
  dangerConfirmBtn: {
    flex: 1,
    padding: "14px",
    backgroundColor: "#e06464",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: "700",
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
  },
  successConfirmBtn: {
    flex: 1,
    padding: "14px",
    backgroundColor: "#3fd17e",
    color: "#0a0f14",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: "700",
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
  },
};

export default GestorCuentas;
