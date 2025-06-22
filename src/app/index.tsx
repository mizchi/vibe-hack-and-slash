#!/usr/bin/env tsx
import React from "react";
import { render } from "ink";
import { Game } from "./Game.tsx";

const app = render(<Game />);

await app.waitUntilExit();
process.exit(0);