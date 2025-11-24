# Frontend Development Guidelines

Guidelines for dashboard development with Next.js, React, and Material UI.

## Tech Stack

- **Framework**: Next.js (App Router or Pages Router)
- **Library**: React 19
- **UI**: Material UI v7
- **Language**: TypeScript (keep simple)
- **State**: React hooks (avoid complex state management)

## MVP Principles for Frontend

### Always Follow
- **Simple components** (functional, not class)
- **Inline state** (useState, useEffect)
- **Direct API calls** (no abstraction layers)
- **Hard-coded values first**
- **One component file** for related UI
- **Copy-paste** over premature abstraction

### Never Use
- Complex state management (Redux, MobX)
- HOCs (Higher-Order Components)
- Render props patterns
- Complex context hierarchies
- "Smart" vs "Dumb" component patterns

## Project Structure

```
dashboard/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx     # Home page
│   │   ├── tickets/     # Tickets section
│   │   └── layout.tsx   # Root layout
│   ├── components/      # Reusable components (keep simple)
│   │   ├── TicketList.tsx
│   │   ├── TicketCard.tsx
│   │   └── Header.tsx
│   └── lib/             # Utilities (minimal)
│       └── api.ts       # API client (simple fetch wrapper)
└── public/              # Static assets
```

## Component Pattern (Simple)

### ✅ CORRECT - Simple Functional Component
```typescript
'use client'; // If using App Router and need interactivity

import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';

interface Ticket {
  id: number;
  subject: string;
  status: string;
  priority: string;
}

export default function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetch('/api/v1/tickets')
      .then(res => res.json())
      .then(data => {
        setTickets(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <Typography variant="h4">Tickets</Typography>
      {tickets.map(ticket => (
        <Card key={ticket.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{ticket.subject}</Typography>
            <Typography color="text.secondary">
              Status: {ticket.status} | Priority: {ticket.priority}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### ❌ WRONG - Over-Engineered
```typescript
// DON'T DO THIS - Too complex for MVP
interface TicketListProps {
  dataSource: ITicketDataSource;
  renderer: ITicketRenderer;
}

class TicketListContainer extends React.Component<TicketListProps> {
  // ... complex lifecycle methods
}

// We don't need this abstraction!
```

## API Calls (Direct and Simple)

### Simple Fetch Pattern
```typescript
// lib/api.ts - Simple API client

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.wellforceit.com';

export async function fetchTickets() {
  const response = await fetch(`${API_BASE}/api/v1/tickets`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Client-ID': 'org_35849015040147', // Can be from context/env
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tickets');
  }

  return response.json();
}

export async function createTicket(data: {
  subject: string;
  description: string;
  priority: string;
}) {
  const response = await fetch(`${API_BASE}/api/v1/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create ticket');
  }

  return response.json();
}
```

### Use in Component
```typescript
import { fetchTickets, createTicket } from '@/lib/api';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetchTickets().then(setTickets).catch(console.error);
  }, []);

  const handleCreate = async (data) => {
    await createTicket(data);
    // Refresh list
    const updated = await fetchTickets();
    setTickets(updated);
  };

  // ... render
}
```

## Material UI Patterns

### Basic Component Styling
```typescript
import { Box, Card, Typography, Button } from '@mui/material';

export default function DashboardCard({ title, value, action }) {
  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="h4" sx={{ my: 2 }}>
        {value}
      </Typography>
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Card>
  );
}
```

### Layout with MUI Grid
```typescript
import { Grid, Container } from '@mui/material';

export default function DashboardLayout({ children }) {
  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {children}
        </Grid>
        <Grid item xs={12} md={4}>
          {/* Sidebar */}
        </Grid>
      </Grid>
    </Container>
  );
}
```

### Form Handling (Simple)
```typescript
import { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

export default function TicketForm({ onSubmit }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple validation
    if (!subject) {
      alert('Subject is required');
      return;
    }

    onSubmit({ subject, description });

    // Reset form
    setSubject('');
    setDescription('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button type="submit" variant="contained">
        Submit
      </Button>
    </Box>
  );
}
```

## State Management (Keep Simple)

### ✅ Local State (Preferred for MVP)
```typescript
// Use useState for component state
function TicketDetail() {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch and update state
  useEffect(() => {
    loadTicket().then(setTicket).finally(() => setLoading(false));
  }, []);

  // ...
}
```

### ✅ Context for Shared State (If Really Needed)
```typescript
// contexts/UserContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

const UserContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
}>({
  user: null,
  setUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);

// Use in component
import { useUser } from '@/contexts/UserContext';

function Header() {
  const { user } = useUser();
  return <div>Welcome, {user?.name}</div>;
}
```

### ❌ Don't Use Complex State Management
```typescript
// DON'T DO THIS for MVP
import { createStore } from 'redux';
// ... complex reducers, actions, middleware
```

## Loading & Error States

### Simple Pattern
```typescript
export default function DataComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!data) return <div>No data</div>;

  return <div>{/* Render data */}</div>;
}
```

## Routing (Next.js)

### App Router (Next.js 13+)
```
app/
├── page.tsx              # Home page (/)
├── tickets/
│   ├── page.tsx         # Tickets list (/tickets)
│   └── [id]/
│       └── page.tsx     # Ticket detail (/tickets/:id)
└── layout.tsx           # Root layout
```

### Link Between Pages
```typescript
import Link from 'next/link';
import { Button } from '@mui/material';

export default function TicketCard({ ticket }) {
  return (
    <Card>
      <CardContent>
        <Typography>{ticket.subject}</Typography>
        <Link href={`/tickets/${ticket.id}`} passHref>
          <Button>View Details</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
```

## Environment Variables

```bash
# .env.local (for development)
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_CLIENT_ID=org_35849015040147

# .env.production (for production)
NEXT_PUBLIC_API_URL=https://api.wellforceit.com
NEXT_PUBLIC_CLIENT_ID=org_35849015040147
```

```typescript
// Use in code
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
```

## Testing (TDD for Frontend Too)

### Component Testing
```typescript
// components/TicketCard.test.tsx
import { render, screen } from '@testing-library/react';
import TicketCard from './TicketCard';

describe('TicketCard', () => {
  it('renders ticket subject', () => {
    const ticket = {
      id: 1,
      subject: 'Test ticket',
      status: 'pending',
    };

    render(<TicketCard ticket={ticket} />);
    expect(screen.getByText('Test ticket')).toBeInTheDocument();
  });

  it('shows status badge', () => {
    const ticket = {
      id: 1,
      subject: 'Test',
      status: 'pending',
    };

    render(<TicketCard ticket={ticket} />);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });
});
```

## Common UI Patterns

### List with Empty State
```typescript
export default function TicketList({ tickets }) {
  if (tickets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No tickets found
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }}>
          Create First Ticket
        </Button>
      </Box>
    );
  }

  return (
    <div>
      {tickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

### Status Badges
```typescript
import { Chip } from '@mui/material';

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'warning';
    case 'in_progress': return 'info';
    case 'resolved': return 'success';
    case 'closed': return 'default';
    default: return 'default';
  }
}

export default function StatusBadge({ status }) {
  return (
    <Chip
      label={status}
      color={getStatusColor(status)}
      size="small"
    />
  );
}
```

### Confirmation Dialog
```typescript
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

## Performance (MVP Reality Check)

### Do These (Simple Optimizations)
- Use React.memo only for expensive renders
- Debounce search inputs
- Paginate long lists
- Lazy load images

### Don't Worry About (Yet)
- Code splitting (Next.js does this)
- Complex memoization
- Virtual scrolling
- Advanced caching strategies

## Checklist Before Committing

- [ ] Following MVP principles (simple components, no complex patterns)
- [ ] Using functional components with hooks
- [ ] Direct API calls (no abstraction layers)
- [ ] Tests written for critical flows
- [ ] Loading and error states handled
- [ ] Mobile responsive (MUI handles most of this)
- [ ] No console errors
- [ ] Component under 200 lines (guideline)

## Common Mistakes to Avoid

### ❌ Complex State Management
```typescript
// Don't add Redux/MobX for MVP
import { createStore, applyMiddleware } from 'redux';
```

### ❌ Premature Abstraction
```typescript
// Don't create complex component hierarchies
<DataProvider>
  <ThemeProvider>
    <RouterProvider>
      <App />
```

### ❌ Over-Styled Components
```typescript
// Don't create styled components for everything
const StyledButton = styled(Button)({
  // ... 50 lines of styles
});
```

### ✅ Keep It Simple
```typescript
// Just use MUI components with sx prop
<Button variant="contained" sx={{ mt: 2, px: 3 }}>
  Click Me
</Button>
```

## Remember

- **Simple components** (functional, minimal)
- **Direct API calls** (no abstraction)
- **Inline state** (useState, useContext)
- **MUI out of the box** (don't over-customize)
- **TDD** (test critical flows)
- **MVP mindset** (ship working UI fast)

When in doubt: "Can this component be simpler?"
