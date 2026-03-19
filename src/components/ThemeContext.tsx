import { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"

// Tipos requeridos para TypeScript
type Theme = {
  darkMode: boolean
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  sidebarColor: string
  headerColor: string
}

type ThemeContextType = {
  theme: Theme
  updateTheme: (newTheme: Partial<Theme>) => void
  resetTheme: () => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Estado inicial desde localStorage o valores por defecto
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("gym_theme")
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme)
      // Ensure background color matches dark mode setting on load, overriding any saved "palette" background
      return {
        ...parsed,
        backgroundColor: parsed.darkMode ? "#0f172a" : "#ffffff",
        sidebarColor: parsed.darkMode ? "#0f172a" : "#ffffff",
        headerColor: parsed.darkMode ? "#0f172a" : "#ffffff",
      }
    }
    return {
      darkMode: true,
      primaryColor: "#dc2626", // Red 600
      secondaryColor: "#1e293b", // Slate 800
      accentColor: "#ef4444", // Red 500
      backgroundColor: "#0f172a", // Slate 900
      sidebarColor: "#0f172a",
      headerColor: "#0f172a",
    }
  })

  // Efecto para guardar en localStorage cuando cambia el tema
  useEffect(() => {
    localStorage.setItem("gym_theme", JSON.stringify(theme))

    // Aplicar clase dark al html si es necesario (para Tailwind)
    if (theme.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    const doUpdate = () => {
      setTheme((prev) => {
        const newDarkMode = !prev.darkMode

        // Sincronizar clases inmediatamente para la transición de vista (View Transition API)
        if (newDarkMode) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }

        return {
          ...prev,
          darkMode: newDarkMode,
          backgroundColor: newDarkMode ? "#0f172a" : "#ffffff",
          sidebarColor: newDarkMode ? "#0f172a" : "#ffffff",
          headerColor: newDarkMode ? "#0f172a" : "#ffffff",
        }
      })
    }

    if (!document.startViewTransition) {
      doUpdate()
      return
    }

    document.startViewTransition(() => {
      // Necesitamos asegurar que React aplique los cambios de DOM inmediatamente
      import("react-dom").then(({ flushSync }) => {
        flushSync(() => {
          doUpdate()
        })
      }).catch(() => {
        doUpdate() // fallback
      })
    })
  }

  // Atajo de teclado 'd' para cambiar de tema
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      const target = event.target
      if (target instanceof HTMLElement) {
        if (target.isContentEditable) return
        if (target.closest("input, textarea, select, [contenteditable='true']")) return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      toggleTheme()
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, []) // Removemos theme temporalmente ya que usamos setTheme state updater

  const updateTheme = (newTheme: Partial<Theme>) => {
    setTheme((prev) => {
      const updated = { ...prev, ...newTheme }

      if (newTheme.darkMode !== undefined) {
        updated.backgroundColor = newTheme.darkMode ? "#0f172a" : "#ffffff"
        updated.sidebarColor = newTheme.darkMode ? "#0f172a" : "#ffffff"
        updated.headerColor = newTheme.darkMode ? "#0f172a" : "#ffffff"
      }

      return updated
    })
  }

  const resetTheme = () => {
    setTheme({
      darkMode: true,
      primaryColor: "#dc2626",
      secondaryColor: "#1e293b",
      accentColor: "#ef4444",
      backgroundColor: "#0f172a",
      sidebarColor: "#0f172a",
      headerColor: "#0f172a",
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
