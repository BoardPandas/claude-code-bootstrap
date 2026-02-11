---
name: react-nextjs
description: React + Next.js + Material UI + TypeScript stack examples. Use when building frontend UIs with React components, Next.js pages, Material UI, or client-side state management.
disable-model-invocation: true
---

# React + Next.js Stack Examples

Stack-specific examples for frontend development with React, Next.js, Material UI, and TypeScript.

> These examples implement the universal principles from the `frontend-dev-guidelines` skill.

## Tech Stack

- **Framework**: Next.js (App Router or Pages Router)
- **Library**: React 19
- **UI**: Material UI v7
- **Language**: TypeScript
- **State**: React hooks (useState, useEffect, useContext)

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx     # Home page
│   ├── items/       # Feature section
│   └── layout.tsx   # Root layout
├── components/      # Reusable components
│   ├── ItemList.tsx
│   ├── ItemCard.tsx
│   └── Header.tsx
└── lib/             # Utilities (minimal)
    └── api.ts       # API client (simple fetch wrapper)
```

## Component Pattern

### Simple Functional Component
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';

interface Item {
  id: number;
  name: string;
  status: string;
  category: string;
}

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/items')
      .then(res => res.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <Typography variant="h4">Items</Typography>
      {items.map(item => (
        <Card key={item.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{item.name}</Typography>
            <Typography color="text.secondary">
              Status: {item.status} | Category: {item.category}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## API Calls (Direct Fetch)

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchItems() {
  const response = await fetch(`${API_BASE}/api/v1/items`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch items');
  return response.json();
}

export async function createItem(data: { name: string; description: string }) {
  const response = await fetch(`${API_BASE}/api/v1/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create item');
  return response.json();
}
```

## Material UI Patterns

### Card Component
```typescript
import { Box, Card, Typography, Button } from '@mui/material';

export default function DashboardCard({ title, value, action }) {
  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="h4" sx={{ my: 2 }}>{value}</Typography>
      {action && (
        <Button variant="contained" onClick={action.onClick}>{action.label}</Button>
      )}
    </Card>
  );
}
```

### Grid Layout
```typescript
import { Grid, Container } from '@mui/material';

export default function DashboardLayout({ children }) {
  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>{children}</Grid>
        <Grid item xs={12} md={4}>{/* Sidebar */}</Grid>
      </Grid>
    </Container>
  );
}
```

### Form Handling
```typescript
import { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

export default function ItemForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) { alert('Name is required'); return; }
    onSubmit({ name, description });
    setName('');
    setDescription('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField fullWidth label="Name" value={name}
        onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
      <TextField fullWidth multiline rows={4} label="Description"
        value={description} onChange={(e) => setDescription(e.target.value)} sx={{ mb: 2 }} />
      <Button type="submit" variant="contained">Submit</Button>
    </Box>
  );
}
```

## State Management

### Local State (Preferred)
```typescript
function ItemDetail() {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadItem().then(setItem).finally(() => setLoading(false));
  }, []);
}
```

### Context for Shared State (Only When Needed)
```typescript
import { createContext, useContext, useState, ReactNode } from 'react';

const UserContext = createContext<{ user: User | null; setUser: (u: User | null) => void }>({
  user: null, setUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
```

## Loading & Error States

```typescript
export default function DataComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData().then(setData).catch(setError).finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!data) return <div>No data</div>;

  return <div>{/* Render data */}</div>;
}
```

## Routing (Next.js App Router)

```
app/
├── page.tsx              # Home page (/)
├── items/
│   ├── page.tsx         # List (/items)
│   └── [id]/
│       └── page.tsx     # Detail (/items/:id)
└── layout.tsx           # Root layout
```

```typescript
import Link from 'next/link';
import { Button } from '@mui/material';

export default function ItemCard({ item }) {
  return (
    <Card>
      <CardContent>
        <Typography>{item.name}</Typography>
        <Link href={`/items/${item.id}`} passHref>
          <Button>View Details</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
```

## Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:3002

# .env.production
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

## Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ItemForm from './ItemForm';

describe('ItemForm', () => {
  it('submits form with valid data', () => {
    const onSubmit = jest.fn();
    render(<ItemForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Test' });
  });
});
```

## Build & Run Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
```
