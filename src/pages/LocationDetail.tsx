import { useParams } from 'react-router-dom'
import { LocationTabs } from '@/components/LocationTabs'

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>()
  
  if (!id) {
    return <div className="text-center">Location not found</div>
  }

  return <LocationTabs locationId={id} />
}