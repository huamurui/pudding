---
title: "Code Samples — Multiple Languages"
date: 2025-06-02
tags: ["tech", "code", "example", "C++/C#"]
description: "Examples of code blocks in different languages for syntax highlighting tests."
---

# Code Samples

## JavaScript

```js
// Simple debounce example
function debounce(fn, wait) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

console.log('debounce ready');
```

## Python

```py
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print(fib(10))
```

## Rust

```rust
fn main() {
    let v = vec![1, 2, 3];
    for x in v.iter() {
        println!("{}", x);
    }
}
```

## Shell

```bash
#!/usr/bin/env bash
echo "Hello from shell"
```

## SQL

```sql
SELECT id, title FROM posts WHERE published = true ORDER BY date DESC LIMIT 10;
```

## Expressive Code Features

Expressive Code provides syntax highlighting, titles, copy buttons, and line/text markers. The `C++/C#` tag on this sample also demonstrates labels containing reserved URL characters.

### Code Block with a Title

```js title="debounce.js"
// Simple debounce example
function debounce(fn, wait) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

console.log('debounce ready');
```

### Highlighted Lines

```py title="fibonacci.py" {1,3-5}
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print(fib(10))
```

### Text Markers

```rust title="main.rs" "println!"
fn main() {
    let v = vec![1, 2, 3];
    for x in v.iter() {
        println!("{}", x);
    }
}
```

Line numbers and collapsible sections are optional Expressive Code plugins and are not enabled in this template. See the [Expressive Code documentation](https://expressive-code.com/key-features/text-markers/) for additional marker syntax.

Continue with the [Markdown extensions sample](./plugins-and-extensions.md). Its source filename resolves to its custom article slug automatically.
