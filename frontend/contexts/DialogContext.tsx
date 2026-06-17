"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DialogType = "alert" | "confirm" | "prompt";
type AlertType = "success" | "error" | "warning" | "info";

interface DialogConfig {
  type: DialogType;
  title: string;
  message: string;
  alertType?: AlertType;
  placeholder?: string;
  defaultValue?: string;
  okText?: string;
  cancelText?: string;
  resolve: (value: any) => void;
}

interface DialogContextProps {
  alert: (message: string, title?: string, alertType?: AlertType, okText?: string) => Promise<void>;
  confirm: (message: string, title?: string, okText?: string, cancelText?: string) => Promise<boolean>;
  prompt: (message: string, placeholder?: string, defaultValue?: string, okText?: string, cancelText?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextProps | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<DialogConfig | null>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config?.type === "prompt") {
      setInputValue(config.defaultValue || "");
      // Autofocus prompt input
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [config]);

  // Handle keyboard submit / escape
  useEffect(() => {
    if (!config) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (config.type === "alert") {
          config.resolve(undefined);
        } else if (config.type === "confirm") {
          config.resolve(false);
        } else if (config.type === "prompt") {
          config.resolve(null);
        }
      } else if (e.key === "Enter" && config.type !== "prompt") {
        e.preventDefault();
        if (config.type === "alert") {
          config.resolve(undefined);
        } else if (config.type === "confirm") {
          config.resolve(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config, inputValue]);

  const alert = (message: string, title = "Notification", alertType: AlertType = "info", okText = "Dismiss") => {
    return new Promise<void>((resolve) => {
      setConfig({
        type: "alert",
        title,
        message,
        alertType,
        okText,
        resolve: () => {
          setConfig(null);
          resolve();
        },
      });
    });
  };

  const confirm = (message: string, title = "Are you sure?", okText = "Confirm", cancelText = "Cancel") => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        type: "confirm",
        title,
        message,
        okText,
        cancelText,
        resolve: (val: boolean) => {
          setConfig(null);
          resolve(val);
        },
      });
    });
  };

  const prompt = (message: string, placeholder = "Enter details...", defaultValue = "", okText = "Confirm", cancelText = "Cancel") => {
    return new Promise<string | null>((resolve) => {
      setConfig({
        type: "prompt",
        title: "Input Required",
        message,
        placeholder,
        defaultValue,
        okText,
        cancelText,
        resolve: (val: string | null) => {
          setConfig(null);
          resolve(val);
        },
      });
    });
  };

  // Get icon and color scheme based on alert type
  const getAlertTheme = (type?: AlertType) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
          iconBg: "bg-emerald-500",
          icon: "check_circle",
          btnClass: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 text-white",
        };
      case "error":
        return {
          bg: "bg-rose-50 text-rose-600 border-rose-100",
          iconBg: "bg-rose-500",
          icon: "error",
          btnClass: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 text-white",
        };
      case "warning":
        return {
          bg: "bg-amber-50 text-amber-600 border-amber-100",
          iconBg: "bg-amber-500",
          icon: "warning",
          btnClass: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 text-white",
        };
      case "info":
      default:
        return {
          bg: "bg-indigo-50 text-indigo-600 border-indigo-100",
          iconBg: "bg-indigo-600",
          icon: "info",
          btnClass: "bg-[#6605c7] hover:bg-[#5504a6] shadow-purple-600/20 text-white",
        };
    }
  };

  const alertTheme = getAlertTheme(config?.alertType);

  const handleSubmitPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (config?.type === "prompt") {
      config.resolve(inputValue);
    }
  };

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}

      <AnimatePresence>
        {config && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with elegant blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (config.type === "alert") config.resolve(undefined);
                if (config.type === "confirm") config.resolve(false);
                if (config.type === "prompt") config.resolve(null);
              }}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            />

            {/* Modal Card container */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              className="relative bg-white rounded-[24px] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden z-10 p-6 font-sans text-slate-800"
            >
              {/* Decorative Accent Header based on type */}
              <div className="flex gap-4 items-start mb-4">
                {config.type === "alert" ? (
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white ${alertTheme.iconBg} shadow-md`}>
                    <span className="material-symbols-outlined text-[24px] font-bold">{alertTheme.icon}</span>
                  </div>
                ) : config.type === "confirm" ? (
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white bg-blue-600 shadow-md shadow-blue-500/20">
                    <span className="material-symbols-outlined text-[24px] font-bold">help</span>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white bg-[#6605c7] shadow-md shadow-purple-500/20">
                    <span className="material-symbols-outlined text-[24px] font-bold">edit_note</span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="text-[18px] font-black text-slate-900 tracking-tight leading-tight">
                    {config.title}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                    {config.type === "alert" ? (config.alertType || "system alert") : `${config.type} required`}
                  </p>
                </div>
              </div>

              {/* Message Content */}
              <div className="my-5">
                <p className="text-[14px] text-slate-600 font-medium leading-relaxed">
                  {config.message}
                </p>
              </div>

              {/* Input for Prompt */}
              {config.type === "prompt" && (
                <form onSubmit={handleSubmitPrompt} className="mb-6">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={config.placeholder}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#6605c7] focus:ring-2 focus:ring-[#6605c7]/10 transition-all text-slate-800"
                  />
                </form>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 mt-4">
                {/* Cancel Button (Not for Alerts) */}
                {config.type !== "alert" && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      if (config.type === "confirm") config.resolve(false);
                      if (config.type === "prompt") config.resolve(null);
                    }}
                    className="px-5 py-3 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl text-[12px] font-extrabold uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    {config.cancelText || "Cancel"}
                  </motion.button>
                )}

                {/* Confirm/OK Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    if (config.type === "alert") config.resolve(undefined);
                    if (config.type === "confirm") config.resolve(true);
                    if (config.type === "prompt") config.resolve(inputValue);
                  }}
                  className={`px-6 py-3 rounded-xl text-[12px] font-extrabold uppercase tracking-widest cursor-pointer shadow-md transition-colors ${
                    config.type === "alert"
                      ? alertTheme.btnClass
                      : config.type === "confirm"
                      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 text-white"
                      : "bg-[#6605c7] hover:bg-[#5504a6] shadow-purple-600/20 text-white"
                  }`}
                >
                  {config.okText || "Confirm"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}
