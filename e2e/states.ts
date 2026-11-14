// A state is a page after the reader does something. The office report has none: it is read only.
import type { Page } from "@playwright/test";

export type PageState = { name: string; path: string; prepare: (page: Page) => Promise<void> };

export const states: PageState[] = [];
