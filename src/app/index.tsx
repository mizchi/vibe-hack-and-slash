#!/usr/bin/env tsx
import React from "react";
import { render } from "ink";
import { Game } from "./Game.tsx";

// ターミナルをクリア
console.clear();

const app = render(<Game />);

await app.waitUntilExit();
process.exit(0);