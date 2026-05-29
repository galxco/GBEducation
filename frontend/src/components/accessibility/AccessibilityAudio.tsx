import { useState, useRef, useEffect } from 'react'

type ReadState = 'idle' | 'playing' | 'paused'

function getPageText(): string {
  const main = document.querySelector('main') ?? document.body
  return (main.innerText ?? '').trim().slice(0, 3000)
}

function getSelectedText(): string {
  return window.getSelection()?.toString().trim() ?? ''
}

export default function AccessibilityAudio() {
  const [open, setOpen]         = useState(false)
  const [state, setState]       = useState<ReadState>('idle')
  const [rate, setRate]         = useState(1.0)
  const [noVoice, setNoVoice]   = useState(false)
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setNoVoice(true)
    }
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  function speak(text: string) {
    if (!text || noVoice) return
    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'pt-BR'
    utter.rate = rate

    const voices = window.speechSynthesis.getVoices()
    const ptVoice = voices.find(v => v.lang.startsWith('pt'))
    if (ptVoice) utter.voice = ptVoice

    utter.onstart  = () => setState('playing')
    utter.onpause  = () => setState('paused')
    utter.onresume = () => setState('playing')
    utter.onend    = () => setState('idle')
    utter.onerror  = () => setState('idle')

    uttRef.current = utter
    window.speechSynthesis.speak(utter)
    setState('playing')
  }

  function pause() {
    if (state === 'playing') {
      window.speechSynthesis.pause()
      setState('paused')
    }
  }

  function resume() {
    if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('playing')
    }
  }

  function stop() {
    window.speechSynthesis.cancel()
    setState('idle')
  }

  function handleReadPage() {
    const text = getPageText()
    if (!text) return
    speak(text)
  }

  function handleReadSelection() {
    const text = getSelectedText()
    if (!text) {
      speak('Nenhum texto selecionado. Selecione um trecho na tela antes de usar esta função.')
      return
    }
    speak(text)
  }

  const stateColor =
    state === 'playing' ? 'bg-green-500' :
    state === 'paused'  ? 'bg-yellow-400' : 'bg-surface-muted'

  const stateLabel =
    state === 'playing' ? 'Lendo...' :
    state === 'paused'  ? 'Pausado' : 'Pronto'

  const rateLabel = rate.toFixed(1).replace('.', ',') + 'x'

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Opções de acessibilidade auditiva"
        title="Leitura em Voz Alta"
        className="
          fixed bottom-20 right-6 z-[55]
          w-12 h-12 rounded-2xl
          bg-surface-muted hover:bg-brand-600
          border border-surface-muted hover:border-brand-500
          shadow-glow hover:shadow-glow-lg
          flex items-center justify-center
          text-slate-300 hover:text-white
          transition-all duration-200 active:scale-95
        "
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {state !== 'idle' && (
          <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${stateColor} animate-pulse`} />
        )}
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
            aria-label="Configurações de leitura em voz alta"
            className="
              fixed bottom-36 right-6 z-[55] w-72
              bg-surface-card border border-surface-border
              rounded-2xl shadow-glow
              animate-slide-up
            "
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.54 8.46a5 5 0 010 7.07" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-semibold text-white">Leitura em Voz Alta</span>
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
              {noVoice && (
                <p className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-3 py-2">
                  Seu navegador não suporta leitura em voz alta. Tente Chrome ou Edge.
                </p>
              )}

              <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-xl border border-surface-border">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stateColor} ${state === 'playing' ? 'animate-pulse' : ''}`} />
                <span className="text-xs text-slate-400">{stateLabel}</span>
                {state !== 'idle' && (
                  <span className="ml-auto text-xs text-slate-500">{rateLabel}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleReadPage}
                  disabled={noVoice || state === 'playing'}
                  className="btn-primary py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
                  title="Ler todo o conteúdo da página atual"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Ler tela
                </button>

                <button
                  onClick={handleReadSelection}
                  disabled={noVoice || state === 'playing'}
                  className="btn-secondary py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
                  title="Ler o texto que você selecionou"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12h6M9 16h4M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Seleção
                </button>
              </div>

              {state !== 'idle' && (
                <div className="grid grid-cols-2 gap-2">
                  {state === 'playing' ? (
                    <button
                      onClick={pause}
                      className="btn-secondary py-2 text-xs flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="6" y="4" width="4" height="16" strokeLinecap="round"/>
                        <rect x="14" y="4" width="4" height="16" strokeLinecap="round"/>
                      </svg>
                      Pausar
                    </button>
                  ) : (
                    <button
                      onClick={resume}
                      className="btn-secondary py-2 text-xs flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Retomar
                    </button>
                  )}
                  <button
                    onClick={stop}
                    className="btn-danger py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round"/>
                    </svg>
                    Parar
                  </button>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Velocidade
                  </p>
                  <span className="text-xs font-semibold text-brand-400">{rateLabel}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={e => setRate(Number(e.target.value))}
                  aria-label={`Velocidade de leitura: ${rateLabel}`}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                    bg-surface-border
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-brand-500
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-glow
                  "
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>Lento</span>
                  <span>Rápido</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 text-center leading-relaxed">
                Selecione um trecho na tela e clique em "Seleção" para ler só essa parte.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
