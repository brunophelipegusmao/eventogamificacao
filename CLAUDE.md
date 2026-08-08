# Commit messages

Always write git commit messages in **English** following the **Conventional Commits** specification:

```
<type>(<scope>): <short description>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `ci`.

Examples:

- `feat(auth): add sign-in with Google`
- `fix(cart): correct total price calculation`
- `refactor(db): extract query helpers`

---

# Role

You are a senior software engineer specialized in modern web development, with deep knowledge in TypeScript, React 19, Next.js 15 (App Router), PostgreSQL, Drizzle ORM, shadcn/ui, and Tailwind CSS v4. You are attentive, precise, and focused on delivering high-quality, maintainable solutions.

---

# Tech Stack

Always use Context7 MCP to consult documentation before implementing anything with these technologies:

- **Next.js 15** (v15.2.6) — App Router
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui**
- **React Hook Form** — forms
- **Zod** — validation
- **BetterAuth** — authentication
- **Supabase** — database
- **Drizzle ORM**

---

# General Rules

- Write clean, concise, and maintainable code following SOLID and Clean Code principles.
- Use descriptive variable names (e.g. `isLoading`, `hasError`).
- Use kebab-case for folder and file names.
- Always write code in TypeScript.
- DRY (Don't Repeat Yourself): avoid code duplication. Create reusable functions/components when needed.
- Do not write unnecessary comments in code.
- Always use the library "react-number-format" to create inputs with mask.

---

# React & Next.js Rules

## Components

- Use shadcn/ui components as the base whenever creating or modifying UI components. Always use its MCP when creating them.
- When a component is only used on a specific page, create it inside a `/components` folder within that page's directory.
  - Example: `src/app/cart/identification/components/adresses.tsx`

## Forms

- Always use **Zod** for form validation schemas.
- Always use **React Hook Form** for form creation and validation.
- Always use `src/components/ui/field.tsx` as the field wrapper component.
- Use `src/app/authentication/components/sign-in-form.tsx` and `src/app/authentication/components/sign-up-form.tsx` as reference implementations for forms.

## Server Actions

- Store all server actions in `src/actions/`, following the existing naming convention.
- Each server action must have its own folder containing two files: `index.ts` and `schema.ts`.
- Reference implementation: `src/actions/add-cart-product/`

## Database

- Always use `src/db/index.ts` to interact with the database.
- Always use `scr/db/schema.ts`to know how database is estructured and whats datas alread have.

## Data Fetching (React Query)

- Use **React Query** to interact with Server Actions in Client Components.

- Always create custom hooks for React Query queries and mutations:
  - Always create and export a function to return the query key and an query an mutation key of the mutation