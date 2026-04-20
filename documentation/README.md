# Weibel Service & Onboarding Platform

A comprehensive internal platform for Weibel (Danish electrical and enterprise service company) to manage customers, locations, and project workflows.

**PHP STORM COMMIT Nr. 3**

## Features

- **User Authentication**: Supabase Auth with email verification and role-based access
- **Customer Management**: Create and manage customers with contact information
- **Location Management**: Track project locations with detailed information
- **Requirements Tracking**: Checklist system for location requirements
- **Image Management**: Upload and organize location photos using Supabase Storage
- **Activity Logging**: Track all user actions and changes
- **Role-Based Access**: Admin and Technician roles with appropriate permissions
- **Modern UI**: Clean, responsive design with Danish-inspired aesthetics

## Tech Stack

- **Frontend**: Vite + React with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for images
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Netlify/Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd weibel-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Click "Connect to Supabase" in the top right of the Bolt interface
   - This will automatically configure your environment variables

4. **Set up the database**
   - Run the SQL migrations provided in the `/supabase/migrations` folder
   - Or use the Supabase dashboard to create the tables manually

5. **Configure Storage**
   - Create a storage bucket called `location-images` in your Supabase project
   - Set up appropriate RLS policies for the bucket

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   - Navigate to `http://localhost:3000`
   - You should see the login page

## Database Schema

The platform uses the following main tables:

- **customers**: Store customer information
- **customer_contacts**: Contact details for each customer
- **locations**: Project locations with address and status
- **location_requirements**: Checklist items for each location
- **location_images**: File references for uploaded images
- **location_activity**: Activity log for all user actions
- **profiles**: User profiles with roles and permissions

## User Roles

- **Admin**: Full access to all features and data
- **Technician**: Limited access to assigned locations only

## Key Features

### Dashboard
- Overview statistics and quick actions
- Recent activity summary
- Status indicators for locations

### Customer Management
- Create and edit customers
- Manage customer contacts
- View all associated locations

### Location Management
- Detailed location information
- Tabbed interface for different aspects:
  - Details: Basic information and customer contacts
  - Requirements: Checklist with progress tracking
  - Images: Photo gallery with upload functionality
  - Activity: Complete audit trail

### Authentication
- Email-based registration and login
- Email verification required
- Role-based access control
- Profile management

## Development

### File Structure
```
/src                 # Source directory
  /pages            # Page components
  /components       # React components
/components         # React components
/lib               # Utilities and configurations
/hooks             # Custom React hooks
```

### Key Components
- `DashboardLayout`: Main application layout
- `AuthProvider`: Authentication context
- `LocationTabs`: Tabbed location interface
- `CustomerList`: Customer management interface
- Various modal components for editing

## Deployment

The application can be deployed to any static hosting service like Netlify or Vercel. Make sure to set the environment variables:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Security

- Row Level Security (RLS) policies ensure data access control
- Technicians can only access their assigned locations
- All database operations are secured through Supabase Auth
- File uploads are restricted to authenticated users

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions, please contact the development team or create an issue in the repository.

## License

This project is proprietary and confidential. All rights reserved by Weibel.