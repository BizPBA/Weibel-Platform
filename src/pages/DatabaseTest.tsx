import { DatabaseDiagnostic } from '@/components/DatabaseDiagnostic'

export default function DatabaseTest() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Database Setup Test</h1>
      <DatabaseDiagnostic />
    </div>
  )
}