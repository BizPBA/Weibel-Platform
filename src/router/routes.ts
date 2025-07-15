import { RouteRecordRaw } from 'vue-router'

// Views
import LoginView from '../views/auth/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import CustomersView from '../views/customers/CustomersView.vue'
import CreateCustomerView from '../views/customers/CreateCustomerView.vue'
import CustomerDetailView from '../views/customers/CustomerDetailView.vue'
import ProjectsView from '../views/projects/ProjectsView.vue'
import CreateProjectView from '../views/projects/CreateProjectView.vue'
import ProjectDetailView from '../views/projects/ProjectDetailView.vue'
import NotFoundView from '../views/NotFoundView.vue'

// Route definitions
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      layout: 'auth',
      title: 'Login'
    }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      title: 'Dashboard'
    }
  },
  {
    path: '/customers',
    name: 'customers',
    component: CustomersView,
    meta: {
      requiresAuth: true,
      title: 'Customers'
    }
  },
  {
    path: '/customers/create',
    name: 'create-customer',
    component: CreateCustomerView,
    meta: {
      requiresAuth: true,
      title: 'Create Customer'
    }
  },
  {
    path: '/customers/:id',
    name: 'customer-detail',
    component: CustomerDetailView,
    meta: {
      requiresAuth: true,
      title: 'Customer Details'
    }
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectsView,
    meta: {
      requiresAuth: true,
      title: 'Projects'
    }
  },
  {
    path: '/projects/create',
    name: 'create-project',
    component: CreateProjectView,
    meta: {
      requiresAuth: true,
      title: 'Create Project'
    }
  },
  {
    path: '/projects/:id',
    name: 'project-detail',
    component: ProjectDetailView,
    meta: {
      requiresAuth: true,
      title: 'Project Details'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: {
      title: 'Page Not Found'
    }
  }
]

export default routes