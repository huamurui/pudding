---
title: "Code Samples — Multiple Languages"
date: 2025-06-02
tags: ["tech","code","example"]
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

Expressive Code provides enhanced code block features including titles, line numbers, highlighting, and more.

### Code Block with Title and Line Numbers

```js {title="Debounce Function with Line Numbers" showLineNumbers=true}
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

```py {title="Fibonacci with Highlighted Lines" highlight="1,3-5"}
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print(fib(10))
```

### Collapsed Code Block

```rust {title="Rust Vector Example" collapsed=true}
fn main() {
    let v = vec![1, 2, 3];
    for x in v.iter() {
        println!("{}", x);
    }
}
```
