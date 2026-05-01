# Coding Standards & Formatting Rules

These rules are **strict** and must always be followed when generating or modifying code.

---

## General Principles

* Code must be **consistent, predictable, and minimal**
* Prefer **readability over cleverness**
* Avoid unnecessary abstractions
* Respect all formatting rules strictly

---

## Formatting Rules

### Quotes

* Always use **double quotes**
* Never use single quotes

```ts
// ✅ Correct
const name = "John"

// ❌ Incorrect
const name = 'John'
```

---

### Strings & Interpolation

* Never use string concatenation
* Always use template literals

```ts
// ✅ Correct
const message = `Hello ${name}`

// ❌ Incorrect
const message = "Hello " + name
```

---

### Semicolons

* Always end statements with `;`

```ts
// ✅ Correct
const value = 10;

// ❌ Incorrect
const value = 10
```

---

### Indentation

* One indentation level = **4 spaces**
* Never use tabs

---

## TypeScript Rules

### Types vs Interfaces

* Always use `type`
* Never use `interface`

```ts
// ✅ Correct
type User = {
    readonly id: string;
}

// ❌ Incorrect
interface User {
    id: string;
}
```

---

### Readonly

* Use `readonly` on all properties whenever possible
* Only omit `readonly` if it causes a TypeScript error

---

### Function Typing

* Types must be declared **outside** of function signatures

```ts
// ✅ Correct
type CreateUserParams = {
	readonly name: string;
	readonly email: string;
};
const createUser = (params: CreateUser): void => {
    return { id: params.name };
};
```

---

### Functions

* Never use `function`
* Always use arrow functions

```ts
// ✅ Correct
const add = (a: number, b: number): number => (a + b);

// ❌ Incorrect
function add(a: number, b: number): number {
    return a + b;
}
```

---

### Enums

* Never use `enum`
* Use `as const` objects

```ts
// ✅ Correct
export const STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
} as const;

export type Status = typeof STATUS[keyof typeof STATUS];

// ❌ Incorrect
enum Status {
    ACTIVE,
    INACTIVE,
}
```

---

## Modules & Exports

### Barrel Files

* Always export folders via an `index.ts`

```ts
export * from "./user";
export * from "./auth";
```

* Never import deep paths when a barrel exists

---

## React / JSX Rules

### Components

* Always use arrow functions
* Never use `function`

```tsx
const MyComponent = (): JSX.Element => {
    return (<div />);
};
```

---

### Props Typing

* Define props types outside the component

```tsx
type Props = {
    readonly title: string;
};

const MyComponent = ({ title }: Props): JSX.Element => {
    return (<div>{title}</div>);
};
```

---

### JSX Formatting

* If a JSX element has more than one prop → multiline

```tsx
// ✅ Correct
<MyComponent
    title="Hello"
    subtitle="World"
/>

// ❌ Incorrect
<MyComponent title="Hello" subtitle="World" />
```

---

## Imports

* Group imports logically
* Avoid unused imports
* Prefer relative imports inside packages

---

## File Structure

* One main responsibility per file
* Use clear, explicit naming
* Avoid overly large files

---

## Forbidden Patterns

* ❌ `interface`
* ❌ `enum`
* ❌ `function` keyword
* ❌ string concatenation with `+`
* ❌ single quotes
* ❌ mutable types when avoidable
* ❌ deep imports when barrel exists

---

## Expected Behavior from Claude

When generating code:

* Always follow these rules strictly
* Never justify breaking a rule unless explicitly instructed
* Prefer refactoring code to comply rather than ignoring rules

---

## Priority

If there is a conflict:

1. Type safety
2. These rules
3. Code readability
