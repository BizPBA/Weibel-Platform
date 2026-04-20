import React from 'react';
import { useState, useEffect } from 'react';
import { BarChart3, Users, MapPin, Activity, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  totalCustomers: number;
  activeLocations: number;
  totalEmployees: number;
}

interface ActivityItem {
  id: string;
  action_text: string;
  created_at: string;
  actor: {
    full_name: string;
  };
}

const Dashboard: React.FC = () => {
  const { profile, user, company } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeLocations: 0,
    totalEmployees: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile?.company_id) {
      fetchDashboardData();
    }
  }, [user, profile?.company_id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // Fetch customers count for this company
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id);

      if (customersError) throw customersError;

      // Fetch locations based on role
      let locationsCount = 0;
      if (profile.role === 'employee') {
        // Employees only see assigned locations
        const { count, error: locationsError } = await supabase
          .from('location_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        if (locationsError) throw locationsError;
        locationsCount = count || 0;
      } else {
        // Other roles see all company locations
        const { count, error: locationsError } = await supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id);

        if (locationsError) throw locationsError;
        locationsCount = count || 0;
      }

      // Fetch total employees count for this company
      const { count: employeesCount, error: employeesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id);

      if (employeesError) {
        console.warn('Could not fetch employees count:', employeesError);
      }

      // Fetch recent activity for this company
      const { data: activity, error: activityError } = await supabase
        .from('company_audit_log')
        .select(`
          id,
          action,
          created_at,
          user:profiles!company_audit_log_user_id_fkey(full_name)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (activityError) {
        console.warn('Could not fetch activity:', activityError);
      }

      // Transform activity data
      const transformedActivity = (activity || []).map(item => ({
        id: item.id,
        action_text: item.action || 'Unknown action',
        created_at: item.created_at,
        actor: {
          full_name: (item.user as any)?.full_name || 'Unknown user'
        }
      }));

      setStats({
        totalCustomers: customersCount || 0,
        activeLocations: locationsCount,
        totalEmployees: employeesCount || 0,
      });

      setRecentActivity(transformedActivity);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your service operations</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Velkommen, {profile?.full_name || 'User'}
        </h1>
        <p className="text-gray-600">
          {company?.name} - Overblik over serviceoperationer
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totale kunder</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Aktive lokationer
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeLocations}</p>
            </div>
            <MapPin className="h-8 w-8 text-success-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Antal medarbejdere</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Seneste aktivitet</h2>
        </div>
        <div className="p-6">
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">{activity.action_text}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()} af {activity.actor?.full_name || 'Ukendt'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Ingen seneste aktivitet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;