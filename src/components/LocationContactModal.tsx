import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type LocationContactForm = {
  full_name: string
  email: string
  phone: string
  role: string
}

interface LocationContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LocationContactForm) => Promise<void>
  initialData?: LocationContactForm | null
  title: string
}

export function LocationContactModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
}: LocationContactModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LocationContactForm>({
    defaultValues: initialData || {
      full_name: '',
      email: '',
      phone: '',
      role: '',
    },
  })

  const handleFormSubmit = async (data: LocationContactForm) => {
    await onSubmit(data)
    reset()
    onClose()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Navn *</Label>
            <Input
              id="full_name"
              {...register('full_name', { required: 'Navn er påkrævet' })}
              placeholder="Indtast navn"
            />
            {errors.full_name && (
              <p className="text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email', {
                required: 'Email er påkrævet',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Ugyldig email-adresse',
                },
              })}
              placeholder="Indtast email"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="Indtast telefonnummer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rolle/Titel</Label>
            <Input
              id="role"
              {...register('role')}
              placeholder="f.eks. Projektleder, Sikkerhedsansvarlig"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuller
            </Button>
            <Button type="submit">
              {initialData ? 'Gem ændringer' : 'Tilføj kontakt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
