import React, { useState } from "react";

// 1. Definimos la interfaz con los tipos de datos de las propiedades
interface InputFieldProps {
  label: string;
  placeholder?: string;
  helperText?: string;
  type?: string;
  value: string;
  // Este es el tipo correcto en React para capturar el cambio de un input de texto
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  showToggle?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  helperText,
  type = "text",
  value,
  onChange,
  showToggle = false,
}) => {
  const [visible, setVisible] = useState(false);
  const inputType = showToggle ? (visible ? "text" : "password") : type;

  return (
    <div style={styles.wrapper}>
      {/* Inyectamos la regla CSS para aplicar el color personalizado al placeholder */}
      <style>{`
        .custom-input::placeholder {
          color: #82888C !important;
          opacity: 1;
        }
        .custom-input:-webkit-autofill,
        .custom-input:-webkit-autofill:hover,
        .custom-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #13161C inset !important;
          -webkit-text-fill-color: #EFEFEF !important;
          caret-color: #EFEFEF;
        }
      `}</style>

      <label style={styles.label}>{label}</label>
      <div style={styles.inputWrapper}>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="custom-input" /* Añadimos la clase para vincular el estilo anterior */
          style={styles.input}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            style={styles.toggleBtn}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {visible ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        )}
      </div>
      {helperText && <span style={styles.helper}>{helperText}</span>}
    </div>
  );
};

// Componentes internos de los iconos SVG
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EFEFEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EFEFEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// Objeto de estilos con tipado estricto de CSS para evitar advertencias
const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    color: "#EFEFEF",
    fontSize: "14px",
    fontWeight: "500", // Inter Bold
    fontFamily: "'Inter', sans-serif",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#13161C",
    border: "1px solid #666666",
    borderRadius: "6px",
    padding: "11px 14px",
    fontSize: "14px",
    fontWeight: "500", // Inter Bold
    fontFamily: "'Inter', sans-serif",
    color: "#EFEFEF", 
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  toggleBtn: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0",
    display: "flex",
    alignItems: "center",
  },
  helper: {
    color: "#8B95A1",
    fontSize: "12px",
    fontWeight: "500", // Inter Bold
    fontFamily: "'Inter', sans-serif",
  },
};

export default InputField;