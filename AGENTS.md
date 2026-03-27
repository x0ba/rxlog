# Agent Info

Generally speaking, you should browse the codebase to figure out what is going on.

We have a few "philosophies" I want to make sure we honor throughout development:

### 1. Performance above all else

When in doubt, do the thing that makes the app feel the fastest to use.

This includes things like

- Optimistic updates
- Avoiding waterfalls in anything from js to file fetching

### 2. Good defaults

Users should expect things to behave well by default. Less config is best.

### 3. Convenience

We should not compromise on simplicity and good ux. We want to be pleasant to use with as little friction as possible. This means things like:

- Getting from homepage to any action the user would want to perform on a regular basis should always be fewer than 4 clicks
- Minimize blocking states to let users get into app asap

### 4. Security

We want to make things convenient, but we don't want to be insecure. Be thoughtful about how things are implemented. Be VERY thoughtful about endpoints exposed "publicly". Use auth and auth checks where they make sense to.

### 5. UI

Refer to [the design document](./docs/design.md) when making UI changes. Use Shadcn components ALWAYS (adding them to the codebase if needed with `bunx --bun shadcn@latest add <component-name>`) and style them to fit the design aesthetic.

### 6. Convex

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.
