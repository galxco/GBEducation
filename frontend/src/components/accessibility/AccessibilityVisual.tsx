import { useState, useEffect } from 'react'

type FontSize = 'normal' | 'large' | 'xlarge'

const FONT_SCALES: Record<FontSize, number> = {
  normal:  1,
  large:   1.2,
  xlarge:  1.45,
}

const FONT_LABELS: Record<FontSize, string> = {
  normal:  'A',
  large:   'A+',
  xlarge:  'A++',
}

export default function AccessibilityVisual() {
  const [open, setOpen]         = useState(false)
  const [fontSize, setFontSize] = useState<FontSize>('normal')
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    document.documentElement.style.fontSize = `${FONT_SCALES[fontSize] * 100}%`
  }, [fontSize])

  useEffect(() => {
    const root = document.documentElement
    if (highContrast) {
      root.classList.add('high-contrast')
      if (!document.getElementById('gb-high-contrast-style')) {
        const style = document.createElement('style')
        style.id = 'gb-high-contrast-style'
        style.textContent = `
          .high-contrast { filter: contrast(1.6) brightness(1.1); }
          .high-contrast img, .high-contrast video { filter: none; }
        `
        document.head.appendChild(style)
      }
    } else {
      root.classList.remove('high-contrast')
    }
  }, [highContrast])

  useEffect(() => {
    const root = document.documentElement
    if (reducedMotion) {
      root.classList.add('reduce-motion')
      if (!document.getElementById('gb-reduce-motion-style')) {
        const style = document.createElement('style')
        style.id = 'gb-reduce-motion-style'
        style.textContent = `
          .reduce-motion *, .reduce-motion *::before, .reduce-motion *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        `
        document.head.appendChild(style)
      }
    } else {
      root.classList.remove('reduce-motion')
    }
  }, [reducedMotion])

  const fontOrder: FontSize[] = ['normal', 'large', 'xlarge']

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Opções de acessibilidade visual"
        title="Acessibilidade Visual"
        className="
          fixed bottom-6 right-6 z-50
          w-12 h-12 rounded-2xl
          bg-brand-600 hover:bg-brand-500
          border border-brand-400/30
          shadow-glow hover:shadow-glow-lg
          flex items-center justify-center
          text-white transition-all duration-200 active:scale-95
        "
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-label="Configurações de acessibilidade visual"
            className="
              fixed bottom-36 right-6 z-50 w-72
              bg-surface-card border border-surface-border
              rounded-2xl shadow-glow
              animate-slide-up
            "
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-semibold text-white">Acessibilidade Visual</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar painel"
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-surface transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Tamanho do texto
                </p>
                <div className="flex gap-2" role="group" aria-label="Tamanho do texto">
                  {fontOrder.map(size => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      aria-pressed={fontSize === size}
                      className={`
                        flex-1 py-2 rounded-xl text-sm font-semibold
                        border transition-all duration-200 active:scale-95
                        ${fontSize === size
                          ? 'bg-brand-600 border-brand-500 text-white shadow-glow'
                          : 'bg-surface border-surface-border text-slate-400 hover:border-brand-500/50 hover:text-slate-200'
                        }
                      `}
                    >
                      {FONT_LABELS[size]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Contraste
                </p>
                <button
                  onClick={() => setHighContrast(h => !h)}
                  aria-pressed={highContrast}
                  className={`
                    w-full py-2.5 px-4 rounded-xl text-sm font-semibold
                    border transition-all duration-200 active:scale-95
                    flex items-center gap-2
                    ${highContrast
                      ? 'bg-brand-600 border-brand-500 text-white shadow-glow'
                      : 'bg-surface border-surface-border text-slate-400 hover:border-brand-500/50 hover:text-slate-200'
                    }
                  `}
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 3v18M3 12h18" strokeLinecap="round"/>
                  </svg>
                  {highContrast ? 'Alto Contraste: On' : 'Alto Contraste: Off'}
                </button>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Movimento
                </p>
                <button
                  onClick={() => setReducedMotion(r => !r)}
                  aria-pressed={reducedMotion}
                  className={`
                    w-full py-2.5 px-4 rounded-xl text-sm font-semibold
                    border transition-all duration-200 active:scale-95
                    flex items-center gap-2
                    ${reducedMotion
                      ? 'bg-brand-600 border-brand-500 text-white shadow-glow'
                      : 'bg-surface border-surface-border text-slate-400 hover:border-brand-500/50 hover:text-slate-200'
                    }
                  `}
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 8h16M4 16h16" strokeLinecap="round"/>
                  </svg>
                  {reducedMotion ? 'Reduzir Animações: On' : 'Reduzir Animações: Off'}
                </button>
              </div>

              <button
                onClick={() => {
                  setFontSize('normal')
                  setHighContrast(false)
                  setReducedMotion(false)
                }}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Restaurar padrão
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
