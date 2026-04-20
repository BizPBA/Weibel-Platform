import { CheckCircle2, Circle } from 'lucide-react'

interface OnboardingStep {
  number: number
  title: string
  description: string
}

interface OnboardingLayoutProps {
  currentStep: number
  steps: OnboardingStep[]
  children: React.ReactNode
}

export function OnboardingLayout({ currentStep, steps, children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <div className="w-full bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">InfoBridge</h1>
              <p className="text-sm text-slate-600 mt-1">Kom i gang med din virksomhed</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />

            <div className="relative flex justify-between">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      step.number < currentStep
                        ? 'bg-blue-600 text-white'
                        : step.number === currentStep
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-white text-slate-400 border-2 border-slate-200'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : step.number === currentStep ? (
                      <Circle className="w-5 h-5 fill-current" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-3 text-center max-w-32">
                    <div
                      className={`text-sm font-medium ${
                        step.number <= currentStep ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 hidden md:block">
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
            {children}
          </div>
        </div>
      </div>

      <div className="w-full bg-white border-t py-4">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-slate-500">
          Har du brug for hjælp? Kontakt support på support@weibel.dk
        </div>
      </div>
    </div>
  )
}
