import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout, { type ItemNav } from "../components/DashboardLayout";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import StatusBadge from "../components/StatusBadge";
import { getCurrentUser } from "../lib/session";
import { perfilService, validarNuevaPassword, type EstadoDonacion, type Usuario } from "../lib/sistratec";
import { api, mensajeDeError } from "../lib/api";

interface TipoDonacion { id: number; nombre: string }
interface CentroAcopio { id: number; nombre: string; direccion?: string }

interface DonacionDonante {
  id: string;
  trackingId: string;
  tipo: string;
  estado: EstadoDonacion;
  descripcion: string;
  fechaRegistro: string;
  destino: string;
}

const variantePorEstado: Record<EstadoDonacion, "recibido" | "en_transito" | "entregado"> = {
  recibido: "recibido",
  en_transito: "en_transito",
  entregado: "entregado",
};

const HeartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PackageSmallIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ITEMS_NAV: ItemNav[] = [
  { clave: "donar", etiqueta: "Registrar donación", icono: <HeartIcon /> },
  { clave: "perfil", etiqueta: "Mi perfil", icono: <UserIcon /> },
];

const DonanteDashboard: React.FC = () => {
  const usuario = getCurrentUser();
  const [seccion, setSeccion] = useState("donar");
  const [donaciones, setDonaciones] = useState<DonacionDonante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [perfilFullName, setPerfilFullName] = useState("");
  const [perfilEmail, setPerfilEmail] = useState("");
  const [perfilPhone, setPerfilPhone] = useState("");
  const [perfilAddress, setPerfilAddress] = useState("");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [mensajePerfil, setMensajePerfil] = useState<string | null>(null);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordRepetir, setPasswordRepetir] = useState("");
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [mensajePass, setMensajePass] = useState<string | null>(null);
  const [errorPass, setErrorPass] = useState<string | null>(null);

  const [tipos, setTipos] = useState<TipoDonacion[]>([]);
  const [centros, setCentros] = useState<CentroAcopio[]>([]);
  const [donationTypeId, setDonationTypeId] = useState<number | "">("");
  const [collectionCenterId, setCollectionCenterId] = useState<number | "">("");
  const [descripcion, setDescripcion] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null);
  const [trackingNuevo, setTrackingNuevo] = useState<string | null>(null);

  const cargarDonaciones = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const raw = await api.get<any[]>("/donations/mine");
      setDonaciones(raw.map((d) => ({
        id: d.id,
        trackingId: d.trackingId,
        tipo: d.donationTypeName ?? "",
        estado: (d.status ?? d.estado) as EstadoDonacion,
        descripcion: d.descripcion ?? "",
        fechaRegistro: d.createdAt ?? "",
        destino: d.collectionCenterName ?? "",
      })));
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDonaciones();
  }, [cargarDonaciones]);

  useEffect(() => {
    api.get<TipoDonacion[]>("/catalog/donation-types").then(setTipos).catch(() => undefined);
    api.get<CentroAcopio[]>("/catalog/collection-centers").then(setCentros).catch(() => undefined);
    perfilService.obtener()
      .then((datos) => {
        setPerfil(datos);
        setPerfilFullName(datos.fullName);
        setPerfilEmail(datos.email);
        setPerfilPhone(datos.phone || "");
        setPerfilAddress(datos.address || "");
        setPickupAddress((actual) => actual || datos.address || "");
      })
      .catch(() => undefined);
  }, []);

  const guardarPerfil = async () => {
    setMensajePerfil(null);
    setErrorPerfil(null);
    setGuardandoPerfil(true);
    try {
      const actualizado = await perfilService.actualizar({
        fullName: perfilFullName.trim(),
        email: perfilEmail.trim(),
        phone: perfilPhone.trim() || undefined,
      });
      setPerfil(actualizado);
      setMensajePerfil("Tus datos se actualizaron correctamente.");
    } catch (err) {
      setErrorPerfil(mensajeDeError(err));
    } finally {
      setGuardandoPerfil(false);
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

  const registrarDonacion = async () => {
    setErrorRegistro(null);
    setTrackingNuevo(null);
    if (!donationTypeId || !collectionCenterId || descripcion.trim().length < 5) {
      setErrorRegistro("Completa el tipo de bien, centro de acopio y una descripción de al menos 5 caracteres.");
      return;
    }
    setRegistrando(true);
    try {
      const datos = await api.post<{ trackingId: string }>("/donations", {
        donationTypeId,
        collectionCenterId,
        descripcion: descripcion.trim(),
        pickupAddress: pickupAddress.trim() || undefined,
        estimatedDeliveryDate: estimatedDeliveryDate || undefined,
      });
      setTrackingNuevo(datos.trackingId);
      setDonationTypeId("");
      setCollectionCenterId("");
      setDescripcion("");
      setPickupAddress(perfilAddress.trim());
      setEstimatedDeliveryDate("");
      cargarDonaciones();
    } catch (err) {
      setErrorRegistro(mensajeDeError(err));
    } finally {
      setRegistrando(false);
    }
  };

  const iniciales = (perfil?.fullName || usuario?.fullName || "U")
    .split(" ")
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

  const total = donaciones.length;
  const enProceso = donaciones.filter((d) => d.estado !== "entregado").length;
  const entregados = donaciones.filter((d) => d.estado === "entregado").length;
  const passwordValida = passwordActual.length > 0 && passwordNueva.length > 0 && passwordRepetir.length > 0;

  return (
    <DashboardLayout
      usuario={usuario}
      items={ITEMS_NAV}
      activo={seccion}
      onSeleccionar={setSeccion}
      titulo={seccion === "perfil" ? "Mi perfil" : "Registrar donación"}
      subtitulo={seccion === "perfil"
        ? "Gestiona tus datos personales, contraseña y revisa el historial de tus donaciones."
        : "Llena el formulario para registrar una nueva donación. Tu información se usa para coordinar la recolección."}
    >
      {seccion === "donar" && (
        <div style={styles.formWrap}>
          <div style={styles.formCard}>
            {trackingNuevo && (
              <div style={styles.successBox}>
                ¡Donación registrada! Tu código de seguimiento es <strong>{trackingNuevo}</strong>. Te lo enviamos también a tu correo.
              </div>
            )}
            {errorRegistro && <div style={styles.errorBox}>{errorRegistro}</div>}

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Tipo de bien donado</label>
              <select
                value={donationTypeId}
                onChange={(e) => setDonationTypeId(e.target.value ? Number(e.target.value) : "")}
                style={styles.select}
              >
                <option value="">Ej: Ropa, alimentos, medicamentos...</option>
                {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
              <span style={styles.helper}>Selecciona la categoría que mejor describe lo que vas a donar.</span>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Descripción detallada</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describí brevemente los artículos..."
                style={styles.textarea}
                rows={3}
              />
              <span style={styles.helper}>Cuántas unidades, estado (nuevo/usado), tamaño aproximado, etc.</span>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Nombre completo del donante</label>
              <input
                value={perfil?.fullName || usuario?.fullName || ""}
                readOnly
                style={{ ...styles.input, ...styles.inputReadOnly }}
              />
              <span style={styles.helper}>Se completa automáticamente con tu perfil.</span>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Correo electrónico</label>
              <input
                value={perfil?.email || usuario?.email || ""}
                readOnly
                style={{ ...styles.input, ...styles.inputReadOnly }}
              />
              <span style={styles.helper}>Para enviarte el código de seguimiento de tu donación.</span>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Centro de acopio</label>
              <select
                value={collectionCenterId}
                onChange={(e) => setCollectionCenterId(e.target.value ? Number(e.target.value) : "")}
                style={styles.select}
              >
                <option value="">Selecciona un centro</option>
                {centros.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <span style={styles.helper}>Lugar donde recibirán físicamente tu donación.</span>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Fecha estimada de entrega</label>
              <input
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                style={styles.input}
              />
              <span style={styles.helper}>Fecha aproximada en que podrás entregar los artículos al centro de acopio.</span>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Dirección de recolección</label>
              <input
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="San José, Montes de Oca"
                style={styles.input}
              />
              <span style={styles.helper}>Dirección exacta donde se recogerá esta donación.</span>
            </div>

            <div style={{ marginTop: 8 }}>
              <PrimaryButton label={registrando ? "Registrando..." : "Registrar donación"} onClick={registrarDonacion} disabled={registrando} />
            </div>
            <div style={styles.cancelWrap}>
            </div>
          </div>
        </div>
      )}

      {seccion === "perfil" && (
        <div style={styles.profileGrid}>
          <div style={styles.profileLeft}>
            <div style={styles.profileCard}>
              <div style={styles.avatarBig}>{iniciales}</div>
              <h3 style={styles.profileName}>{perfil?.fullName || usuario?.fullName || ""}</h3>
              <span style={styles.profileEmail}>{perfil?.email || usuario?.email || ""}</span>
              <span style={styles.profileTag}>Donante registrado</span>
            </div>

            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>Datos personales</h2>
              <span style={styles.panelDesc}>Estos datos se usan para registrar donaciones y contactarte.</span>

              <div style={styles.formCol}>
                <InputField
                  label="Nombre completo"
                  value={perfilFullName}
                  onChange={(e) => setPerfilFullName(e.target.value)}
                  helperText="Tu nombre tal y como aparece en tu cédula."
                />
                <InputField
                  label="Correo electrónico"
                  type="email"
                  value={perfilEmail}
                  onChange={(e) => setPerfilEmail(e.target.value)}
                  helperText="Se usa para iniciar sesión y recibir notificaciones."
                />
                <InputField
                  label="Teléfono"
                  value={perfilPhone}
                  onChange={(e) => setPerfilPhone(e.target.value)}
                  helperText="Para contactarte si hay un problema con tu donación."
                />
                <InputField
                  label="Dirección"
                  value={perfilAddress}
                  onChange={(e) => setPerfilAddress(e.target.value)}
                  helperText="Dirección de recolección por defecto."
                />
              </div>

              {mensajePerfil && <div style={styles.successBox}>{mensajePerfil}</div>}
              {errorPerfil && <div style={styles.errorBox}>{errorPerfil}</div>}

              <div style={{ marginTop: 8 }}>
                <PrimaryButton label={guardandoPerfil ? "Guardando..." : "Guardar cambios"} onClick={guardarPerfil} disabled={guardandoPerfil} />
              </div>
            </div>

            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>Cambiar contraseña</h2>
              <span style={styles.panelDesc}>Por seguridad, te pediremos tu contraseña actual.</span>

              <div style={styles.formCol}>
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
                  helperText="Mínimo 8 caracteres, una letra mayúscula y un número para mayor seguridad."
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

          <div style={styles.profileRight}>
            <div style={styles.donationsHeader}>
              <h2 style={styles.panelTitle}>Mis donaciones</h2>
            </div>

            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <PackageSmallIcon />
                <span style={styles.statValue}>{total}</span>
                <span style={styles.statLabel}>Total</span>
              </div>
              <div style={styles.statBox}>
                <PackageSmallIcon />
                <span style={styles.statValue}>{enProceso}</span>
                <span style={styles.statLabel}>En proceso</span>
              </div>
              <div style={styles.statBox}>
                <PackageSmallIcon />
                <span style={styles.statValue}>{entregados}</span>
                <span style={styles.statLabel}>Entregadas</span>
              </div>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            {cargando ? (
              <p style={styles.vacio}>Cargando donaciones...</p>
            ) : donaciones.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyIcon}><PackageSmallIcon /></div>
                <p style={styles.emptyTitle}>Aún no tenés donaciones registradas</p>
                <p style={styles.emptyDesc}>Cuando registrés una donación, podrás ver su estado y seguimiento aquí.</p>
                <button style={styles.emptyBtn} onClick={() => setSeccion("donar")}>
                  Registrar mi primera donación
                </button>
              </div>
            ) : (
              <div style={styles.donList}>
                {donaciones.map((d) => (
                  <div key={d.id} style={styles.donRow}>
                    <div style={styles.donHeader}>
                      <div style={styles.donCodeWrap}>
                        <PackageSmallIcon />
                        <span style={styles.donCode}>{d.trackingId}</span>
                      </div>
                      <StatusBadge variant={variantePorEstado[d.estado]} />
                    </div>
                    <span style={styles.donDate}>Registrada el {d.fechaRegistro ? new Date(d.fechaRegistro).toLocaleDateString("es-CR") : ""}</span>
                    <div style={styles.donDetailRow}>
                      <div style={styles.donDetail}>
                        <span style={styles.donDetailLabel}>Tipo de bien</span>
                        <span style={styles.donDetailValue}>{d.tipo}</span>
                      </div>
                      <div style={styles.donDetail}>
                        <span style={styles.donDetailLabel}>Destino</span>
                        <span style={styles.donDetailValue}>{d.destino}</span>
                      </div>
                      <button
                        style={styles.verBtn}
                        onClick={() => window.open(`/#/track?code=${d.trackingId}`, "_blank")}
                      >
                        <EyeIcon />
                        Ver seguimiento
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  formWrap: {
    display: "flex",
    justifyContent: "center",
  },
  formCard: {
    backgroundColor: "#1A1D23",
    border: "1px solid #232830",
    borderRadius: "16px",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    width: "100%",
    maxWidth: 560,
  },
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
  helper: {
    color: "#7a8696",
    fontSize: "11px",
    fontFamily: "'Inter', sans-serif",
  },
  input: {
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
  inputReadOnly: {
    color: "#cdd6e0",
    backgroundColor: "#191c22",
  },
  textarea: {
    backgroundColor: "#13161C",
    border: "1px solid #2e3f50",
    borderRadius: "8px",
    padding: "12px 14px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    color: "#EFEFEF",
    outline: "none",
    resize: "vertical",
    width: "100%",
    boxSizing: "border-box",
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
  cancelWrap: {
    display: "flex",
    justifyContent: "center",
    marginTop: 4,
  },
  cancelLink: {
    background: "none",
    border: "none",
    color: "#00d4f5",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
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
    backgroundColor: "rgba(184,134,11,0.10)",
    border: "1px solid #b8860b",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#f0d488",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
  },

  profileGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 360px) 1fr",
    gap: "24px",
    alignItems: "start",
  },
  profileLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  profileRight: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
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
  formCol: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  donationsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  statBox: {
    backgroundColor: "#1A1D23",
    border: "1px solid #232830",
    borderRadius: "12px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#8a9bb0",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
  },
  statLabel: {
    color: "#8a9bb0",
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
  },
  donList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  donRow: {
    backgroundColor: "#1A1D23",
    border: "1px solid #232830",
    borderRadius: "12px",
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  donHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  donCodeWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#00d4f5",
  },
  donCode: {
    color: "#00d4f5",
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
  },
  donDate: {
    color: "#8a9bb0",
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
  },
  donDetailRow: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    flexWrap: "wrap",
    marginTop: 6,
  },
  donDetail: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  donDetailLabel: {
    color: "#7a8696",
    fontSize: 11,
    fontFamily: "'Inter', sans-serif",
  },
  donDetailValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
  },
  verBtn: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(0,212,245,0.10)",
    border: "1px solid #00d4f5",
    color: "#00d4f5",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
  },
  emptyCard: {
    backgroundColor: "#1A1D23",
    border: "1px solid #232830",
    borderRadius: "14px",
    padding: "40px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    textAlign: "center",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    backgroundColor: "rgba(0,212,245,0.10)",
    color: "#00d4f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    margin: 0,
  },
  emptyDesc: {
    color: "#8a9bb0",
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
    margin: 0,
    maxWidth: 320,
  },
  emptyBtn: {
    marginTop: 6,
    background: "#00d4f5",
    border: "none",
    color: "#0a0f14",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
  },
  vacio: {
    color: "#8a9bb0",
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    textAlign: "center",
    padding: "30px 0",
  },
};

export default DonanteDashboard;
