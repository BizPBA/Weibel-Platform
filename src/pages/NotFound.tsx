import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-50 text-primary-600 mb-8">
          <Compass className="w-10 h-10" />
        </div>

        <h1 className="text-7xl md:text-8xl font-bold text-gray-900 tracking-tight mb-4">
          404
        </h1>

        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
          Siden findes ikke
        </h2>

        <p className="text-gray-600 leading-relaxed mb-10 max-w-md mx-auto">
          Beklager, den side du leder efter findes ikke længere eller er blevet flyttet.
          Tjek adressen, eller vend tilbage til dashboardet.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Tilbage til dashboard
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Gå tilbage
          </Button>
        </div>
      </div>
    </div>
  )
}
